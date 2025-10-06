# Assigning shop access with groups

This guide walks tenant administrators and group managers through the end-to-end workflow for letting a user work with a shop. It covers how groups, shops, and user shop roles relate to each other, the API calls involved, and where to manage them inside the admin UI.

## How the pieces fit together

- **Organization** – the tenant that owns every resource in the flow. All users, groups, and shops must belong to the same organization before they can be linked.
- **Shop group** – a managed collection of users and shops. A group has a single manager (who automatically gets shop ownership when a shop joins the group) plus any number of active members.
- **Shop authorization** – a connected channel shop (TikTok, Amazon, etc.). Each shop is mapped to a group (optional) and organization (required).
- **User shop role** – the per-shop capability granted to a user (`OWNER`, `MANAGER`, `STAFF`, `VIEWER`). These roles drive what the user can do inside 9Connect for that shop.

The typical path is:

1. Make sure everyone is part of the organization.
2. Create or update a shop group and add members.
3. Attach shops to the right group.
4. Issue user shop roles for the people who should work with that shop.

Administrators can perform all steps. Group managers can maintain their own group membership and assign roles for shops mapped to that group.

## Prerequisites

- You are signed in and have selected an **active organization** (the backend returns `ACTIVE_ORG_REQUIRED` if not).
- You have the bearer token or session cookie that authenticates requests; all API examples include the `Authorization: Bearer <token>` header.
- The target users already exist and belong to the organization (`organizationMember`).
- Shops have been imported/authorized via the channel onboarding flow.

## 1. Create or update shop groups

Use the Shop Groups admin screen (`Admin → User & Access → Shop Groups`) or call the API below.

### Create a group (admin only)

```bash
curl -X POST "https://<your-host>/api/shop-groups" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Key Accounts",
        "description": "Strategic brands for Q4",
        "managerId": "<manager-user-id>",
        "memberIds": ["<another-user-id>"]
      }'
```

Successful responses return `{ group }` with the manager and member roster. The API automatically ensures:

- The manager and every member belong to the organization.
- The manager is stored as the default member and will act as the group contact.

### Review or edit a group

```bash
# Fetch detail
curl -H "Authorization: Bearer <token>" \
  "https://<your-host>/api/shop-groups/<groupId>"

# Update name, manager, or membership (admin or current group manager)
curl -X PATCH "https://<your-host>/api/shop-groups/<groupId>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Key Accounts SEA",
        "managerId": "<new-manager-id>",
        "memberIds": ["<user-id-1>", "<user-id-2>"],
        "defaultMemberId": "<user-id-1>"
      }'
```

Notes:

- Removing a user from `memberIds` will automatically drop them from the group and from any future shop syncs.
- Setting `defaultMemberId` marks who receives default shop assignments when stores move into the group.

## 2. Assign shops to groups

Map each shop authorization to the group that should manage it. Only administrators can move a shop between groups.

```bash
curl -X PATCH "https://<your-host>/api/shops/<shopAuthorizationId>/group" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "groupId": "<group-id-or-null>" }'
```

When you move a shop to a new group the backend will:

- Remove any user shop roles for people who are not active members of the destination group.
- Promote the group manager to `OWNER` for that shop (creating or updating the role as needed).

You can set `groupId` to `null` to detach a shop from any group while keeping existing roles in place.

## 3. Grant shop roles to users

With the group and shop in place, issue a user shop role so someone can work in that shop. Administrators and active managers of the shop’s group can assign roles.

```bash
curl -X POST "https://<your-host>/api/user-shop-roles" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "userId": "<user-id>",
        "shopId": "<shop-authorization-id>",
        "role": "MANAGER"
      }'
```

Validation that happens automatically:

- The shop must belong to the active organization.
- The target user must be an organization member (and, if the shop belongs to a group, an active member of that group).
- Duplicate roles are blocked with a `409` (`User already has a role for this shop`).

To list roles with pagination and filters:

```bash
curl -H "Authorization: Bearer <token>" \
  "https://<your-host>/api/user-shop-roles?page=1&limit=20&userId=<user-id>&shopId=<shop-id>"
```

Remove a role (admins only) with:

```bash
curl -X DELETE "https://<your-host>/api/user-shop-roles?id=<user-shop-role-id>" \
  -H "Authorization: Bearer <token>"
```

## UI quick start

1. Navigate to **Admin → User & Access → Shop Groups** to create or manage groups and member lists.
2. Head to **Admin → Channels → Shops** to move a shop into the correct group (the move dialog enforces the same checks as the API).
3. Go to **Admin → User & Access → User Roles** to assign or revoke per-shop roles. The grid shows each user’s current group memberships and accessible shops so you can confirm the configuration before saving.

Changes made in the UI hit the same endpoints described above, so you can mix UI actions with direct API calls as needed.

## Troubleshooting

- **403 Forbidden** – your user lacks permission (only org admins or the relevant group manager may act). Check your session role and group membership.
- **409 ACTIVE_ORG_REQUIRED** – pick an organization in the header selector so the backend can scope your request.
- **404 Not found** – the shop, group, or role doesn’t belong to the active organization.
- **400 Invalid group configuration** – one or more users you tried to assign are not organization members or inactive in the target group.

If you run into issues not covered here, capture the HTTP status, request payload, and correlation ID from the response headers and contact the 9Connect support team.
