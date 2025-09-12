import cron, { ScheduledTask } from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { JobExecutor } from './job-executor';

export class SchedulerService {
  private static instance: SchedulerService;
  private prisma: PrismaClient;
  private jobExecutor: JobExecutor;
  private scheduledJobs: Map<string, ScheduledTask> = new Map();
  private isRunning: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient();
    this.jobExecutor = new JobExecutor(this.prisma);
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting scheduler service...');
    this.isRunning = true;

    // Load and schedule all active jobs
    await this.loadAndScheduleJobs();

    // Start cleanup task (runs every hour)
    cron.schedule('0 * * * *', () => {
      this.cleanupOldExecutions();
    });

    console.log('Scheduler service started successfully');
  }

  public async stop(): Promise<void> {
    console.log('Stopping scheduler service...');
    this.isRunning = false;

    // Cancel all scheduled jobs
    for (const [jobId, task] of this.scheduledJobs) {
      task.stop();
      task.destroy();
    }
    this.scheduledJobs.clear();

    await this.prisma.$disconnect();
    console.log('Scheduler service stopped');
  }

  private async loadAndScheduleJobs(): Promise<void> {
    try {
      const activeJobs = await this.prisma.schedulerJob.findMany({
        where: {
          status: 'ACTIVE',
          triggerType: {
            in: ['CRON', 'INTERVAL']
          }
        }
      });

      for (const job of activeJobs) {
        await this.scheduleJob(job);
      }

      console.log(`Loaded and scheduled ${activeJobs.length} jobs`);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  }

  public async scheduleJob(job: any): Promise<void> {
    try {
      // Remove existing scheduled job if any
      this.unscheduleJob(job.id);

      let cronExpression: string;

      if (job.triggerType === 'CRON') {
        cronExpression = job.cronExpression;
      } else if (job.triggerType === 'INTERVAL') {
        // Convert interval minutes to cron expression
        cronExpression = `*/${job.intervalMinutes} * * * *`;
      } else {
        // For ONE_TIME jobs, we'll handle them separately
        if (job.triggerType === 'ONE_TIME') {
          await this.scheduleOneTimeJob(job);
        }
        return;
      }

      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        console.error(`Invalid cron expression for job ${job.id}: ${cronExpression}`);
        return;
      }

      const task = cron.schedule(
        cronExpression,
        async () => {
          await this.executeJob(job, 'SCHEDULED');
        },
        {
          timezone: 'UTC'
        }
      );

      this.scheduledJobs.set(job.id, task);
      console.log(`Scheduled job ${job.id} with expression: ${cronExpression}`);
    } catch (error) {
      console.error(`Error scheduling job ${job.id}:`, error);
    }
  }

  private async scheduleOneTimeJob(job: any): Promise<void> {
    const now = new Date();
    const scheduledTime = new Date(job.scheduledAt);

    if (scheduledTime <= now) {
      // Execute immediately if scheduled time has passed
      await this.executeJob(job, 'SCHEDULED');
      return;
    }

    const delay = scheduledTime.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.executeJob(job, 'SCHEDULED');
    }, delay);

    console.log(`Scheduled one-time job ${job.id} to execute at ${scheduledTime}`);
  }

  public unscheduleJob(jobId: string): void {
    const task = this.scheduledJobs.get(jobId);
    if (task) {
      task.stop();
      task.destroy();
      this.scheduledJobs.delete(jobId);
      console.log(`Unscheduled job ${jobId}`);
    }
  }

  public async executeJob(job: any, triggeredBy: string = 'MANUAL'): Promise<any> {
    try {
      console.log(`Executing job ${job.id} (${job.name}) - triggered by: ${triggeredBy}`);

      // Create execution record
      const execution = await this.prisma.jobExecution.create({
        data: {
          jobId: job.id,
          status: 'RUNNING',
          startedAt: new Date(),
          triggeredBy
        }
      });

      // Execute the job
      const result = await this.jobExecutor.execute(job, execution.id);

      // Update execution record
      await this.prisma.jobExecution.update({
        where: { id: execution.id },
        data: {
          status: result.success ? 'SUCCESS' : 'FAILED',
          completedAt: new Date(),
          duration: Date.now() - execution.startedAt!.getTime(),
          result: result.success ? JSON.stringify(result.data) : undefined,
          error: result.success ? undefined : result.error
        }
      });

      // Update job's last executed time
      if (result.success) {
        await this.prisma.schedulerJob.update({
          where: { id: job.id },
          data: { lastExecutedAt: new Date() }
        });
      }

      return execution;
    } catch (error) {
      console.error(`Error executing job ${job.id}:`, error);
      throw error;
    }
  }

  private async cleanupOldExecutions(): Promise<void> {
    try {
      const config = await this.prisma.schedulerConfig.findFirst();
      const cleanupDays = config?.cleanupDays || 30;
      const cutoffDate = new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000);

      const deletedCount = await this.prisma.jobExecution.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Cleaned up ${deletedCount.count} old job executions`);
    } catch (error) {
      console.error('Error cleaning up old executions:', error);
    }
  }
}
