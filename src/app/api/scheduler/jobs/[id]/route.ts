import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.schedulerJob.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { id: true, name: true, username: true }
        },
        executions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            retries: {
              select: { id: true, status: true, createdAt: true }
            }
          }
        },
        logs: {
          orderBy: { timestamp: "desc" },
          take: 50
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const body = await req.json();
    const {
      name,
      description,
      status,
      triggerType,
      cronExpression,
      intervalMinutes,
      scheduledAt,
      config,
      timeout,
      retryCount,
      retryDelay,
      tags
    } = body;

    const existingJob = await prisma.schedulerJob.findUnique({
      where: { id: params.id }
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Calculate next execution time if trigger config changed
    let nextExecutionAt = existingJob.nextExecutionAt;
    if (triggerType === "ONE_TIME" && scheduledAt) {
      nextExecutionAt = new Date(scheduledAt);
    } else if (triggerType === "INTERVAL" && intervalMinutes) {
      nextExecutionAt = new Date(Date.now() + intervalMinutes * 60 * 1000);
    }

    const updatedJob = await prisma.schedulerJob.update({
      where: { id: params.id },
      data: {
        name,
        description,
        status,
        triggerType,
        cronExpression,
        intervalMinutes,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        config: config ? JSON.stringify(config) : undefined,
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

    // Update the job in the scheduler
    await fetch(`${process.env.NEXTAUTH_URL}/api/scheduler/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: params.id })
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const job = await prisma.schedulerJob.findUnique({
      where: { id: params.id }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Soft delete by updating status
    await prisma.schedulerJob.update({
      where: { id: params.id },
      data: { status: "DELETED" }
    });

    // Unregister the job from the scheduler
    await fetch(`${process.env.NEXTAUTH_URL}/api/scheduler/unregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: params.id })
    });

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
