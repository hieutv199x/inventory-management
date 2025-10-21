# Tracking Alerts Daily Job

## Overview
Automated daily job that analyzes fulfillment tracking states and sends Telegram notifications for orders stuck in PROCESSING status.

## Endpoint
`GET /api/jobs/tracking-alerts`

## Schedule
- **Production (Vercel Cron)**: Daily at 2:00 AM UTC (9:00 AM Vietnam time)
- **Manual Trigger**: Call the endpoint directly with authorization

## Authentication
Requires one of:
- `Authorization: Bearer <CRON_SECRET>` header
- `Authorization: Bearer <INTERNAL_JOB_SECRET>` header

Set environment variable:
```bash
CRON_SECRET=your-secret-here
# or
INTERNAL_JOB_SECRET=your-secret-here
```

## What It Does

1. **Fetches** all organizations with active Telegram configuration
2. **Analyzes** PROCESSING tracking states for each organization:
   - **Warning**: Shipments stuck for 8-9 days
   - **Critical**: Shipments stuck for 10+ days
3. **Sends** Telegram notification if any issues found
4. **Returns** summary report

## Response Format

### Success Response
```json
{
  "success": true,
  "processedOrgs": 3,
  "totalWarnings": 12,
  "totalCritical": 5,
  "notificationsSent": 3,
  "results": [
    {
      "orgId": "org_123",
      "orgName": "Company A",
      "warning": 5,
      "critical": 2,
      "notificationSent": true
    }
  ],
  "executionTimeMs": 1234
}
```

### No Organizations Response
```json
{
  "success": true,
  "message": "No organizations with active Telegram configuration",
  "processedOrgs": 0,
  "executionTimeMs": 123
}
```

## Telegram Message Format

```
⚠️ BÁO CÁO CẢNH BÁO VẬN CHUYỂN PROCESSING
📅 21/10/2025 09:00:00
🏢 Tổ chức: Company ABC

🟡 CẢNH BÁO (8-9 ngày): 5 vận đơn
  • TRK123456789
    Shop A | Đơn: ORD001 | 8 ngày
  • TRK234567890
    Shop B | Đơn: ORD002 | 9 ngày
  • ...và 3 vận đơn khác

🔴 NGUY CẤP (10+ ngày): 2 vận đơn
  • TRK345678901
    Shop C | Đơn: ORD003 | 12 ngày
  • TRK456789012
    Shop D | Đơn: ORD004 | 15 ngày

⚡ Hành động cần thiết:
• Kiểm tra trạng thái với đơn vị vận chuyển
• Liên hệ seller nếu cần cập nhật
• Theo dõi để tránh khiếu nại từ khách hàng
```

## Manual Testing

### Local Development
```bash
curl http://localhost:3000/api/jobs/tracking-alerts \
  -H "Authorization: Bearer your-secret-here"
```

### Production
```bash
curl https://your-domain.com/api/jobs/tracking-alerts \
  -H "Authorization: Bearer your-secret-here"
```

## Prerequisites

1. **Telegram Configuration**: Organizations must have active Telegram config in `organizationTelegramConfig` table
2. **Prisma Client**: `FulfillmentTrackingState` model must be available
3. **Environment Variables**: `CRON_SECRET` or `INTERNAL_JOB_SECRET` set

## Cron Schedule Format

Current schedule: `0 2 * * *`
- Minute: 0
- Hour: 2 (UTC) = 9 AM Vietnam time
- Day of month: * (every day)
- Month: * (every month)
- Day of week: * (every day)

### Customizing Schedule

To change the schedule, edit `vercel.json`:

```json
{
  "path": "/api/jobs/tracking-alerts",
  "schedule": "0 2 * * *"  // Adjust this cron expression
}
```

Common schedules:
- `0 2 * * *` - Daily at 2 AM UTC (9 AM Vietnam)
- `0 1 * * *` - Daily at 1 AM UTC (8 AM Vietnam)
- `0 2 * * 1-5` - Weekdays only at 2 AM UTC
- `0 2,14 * * *` - Twice daily: 2 AM and 2 PM UTC

## Error Handling

- **Per-organization errors**: Logged but don't stop processing other orgs
- **Notification failures**: Logged with error details in response
- **Global errors**: Return 500 with error message

## Monitoring

Check the response to see:
- How many orgs were processed
- How many notifications were sent
- Any errors per organization
- Total execution time

## Related APIs

- `/api/fulfillment/tracking-states/processing-summary?notify=true` - On-demand summary with notification
- `/api/fulfillment/tracking-states` - List all tracking states
- `/api/fulfillment/tracking-states/[id]/sync` - Sync individual tracking state
