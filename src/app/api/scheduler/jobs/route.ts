import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SchedulerService } from "@/lib/scheduler/scheduler-service";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const search = searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (tags.length > 0) where.tags = { hasEvery: tags };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.schedulerJob.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, username: true }
          },
          _count: {
            select: {
              executions: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.schedulerJob.count({ where })
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {

    const body = await req.json();
    const {
      name,
      description,
      type,
      triggerType,
      cronExpression,
      intervalMinutes,
      scheduledAt,
      config,
      timeout,
      retryCount,
      retryDelay,
      tags = []
    } = body;

    // Validate required fields
    if (!name || !type || !triggerType || !config) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate trigger configuration
    if (triggerType === "CRON" && !cronExpression) {
      return NextResponse.json(
        { error: "Cron expression required for CRON trigger type" },
        { status: 400 }
      );
    }

    if (triggerType === "INTERVAL" && !intervalMinutes) {
      return NextResponse.json(
        { error: "Interval minutes required for INTERVAL trigger type" },
        { status: 400 }
      );
    }

    if (triggerType === "ONE_TIME" && !scheduledAt) {
      return NextResponse.json(
        { error: "Scheduled time required for ONE_TIME trigger type" },
        { status: 400 }
      );
    }

    // Calculate next execution time
    let nextExecutionAt = null;
    if (triggerType === "ONE_TIME") {
      nextExecutionAt = new Date(scheduledAt);
    } else if (triggerType === "INTERVAL") {
      nextExecutionAt = new Date(Date.now() + intervalMinutes * 60 * 1000);
    }
    // For CRON, we'll calculate this in the scheduler service

    const job = await prisma.schedulerJob.create({
      data: {
        name,
        description,
        type,
        triggerType,
        cronExpression,
        intervalMinutes,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        config: JSON.stringify(config),
        timeout,
        retryCount,
        retryDelay,
        tags,
        nextExecutionAt
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    await SchedulerService.getInstance().scheduleJob(job);

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add PUT handler for updating jobs and re-registering
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      description,
      type,
      triggerType,
      cronExpression,
      intervalMinutes,
      scheduledAt,
      config,
      timeout,
      retryCount,
      retryDelay,
      tags = []
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    // Validate required fields
    if (!name || !type || !triggerType || !config) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate trigger configuration
    if (triggerType === "CRON" && !cronExpression) {
      return NextResponse.json(
        { error: "Cron expression required for CRON trigger type" },
        { status: 400 }
      );
    }

    if (triggerType === "INTERVAL" && !intervalMinutes) {
      return NextResponse.json(
        { error: "Interval minutes required for INTERVAL trigger type" },
        { status: 400 }
      );
    }

    if (triggerType === "ONE_TIME" && !scheduledAt) {
      return NextResponse.json(
        { error: "Scheduled time required for ONE_TIME trigger type" },
        { status: 400 }
      );
    }

    // Calculate next execution time
    let nextExecutionAt = null;
    if (triggerType === "ONE_TIME") {
      nextExecutionAt = new Date(scheduledAt);
    } else if (triggerType === "INTERVAL") {
      nextExecutionAt = new Date(Date.now() + intervalMinutes * 60 * 1000);
    }

    const job = await prisma.schedulerJob.update({
      where: { id },
      data: {
        name,
        description,
        type,
        triggerType,
        cronExpression,
        intervalMinutes,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        config: JSON.stringify(config),
        timeout,
        retryCount,
        retryDelay,
        tags,
        nextExecutionAt
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    // Register the job with the scheduler after update
    SchedulerService.getInstance().scheduleJob(job);

    return NextResponse.json(job, { status: 200 });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
