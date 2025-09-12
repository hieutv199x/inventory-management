import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SchedulerService } from "@/lib/scheduler/scheduler-service";

const prisma = new PrismaClient();
const scheduler = SchedulerService.getInstance();

export async function POST(req: NextRequest) {
  try {

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const job = await prisma.schedulerJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "ACTIVE") {
      return NextResponse.json({ error: "Job is not active" }, { status: 400 });
    }

    // Execute the job manually
    const execution = await scheduler.executeJob(job, "MANUAL");

    return NextResponse.json({
      message: "Job execution started",
      executionId: execution.id
    });
  } catch (error) {
    console.error("Error executing job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
