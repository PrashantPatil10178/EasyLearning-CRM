# WhatsApp Triggers System

Automatically send WhatsApp messages via AISensy when lead status changes, just like the PHP implementation.

## 🚀 How It Works

When a lead's status changes (e.g., to `CONVERTED`), the system:

1. **Checks for active trigger** - Looks up if there's an enabled WhatsApp trigger for that status
2. **Gets lead data** - Fetches lead information (name, phone, email, etc.)
3. **Normalizes phone** - Adds "91" prefix for 10-digit Indian numbers
4. **Replaces parameters** - Substitutes template variables with actual lead data
5. **Sends WhatsApp** - Calls AISensy API with campaign name and parameters
6. **Logs activity** - Records the WhatsApp send in lead's activity timeline

## 📁 System Architecture

```
src/
├── server/
│   ├── services/
│   │   └── whatsapp-trigger.ts          # Core trigger logic
│   └── api/routers/
│       ├── lead.ts                       # updateStatus mutation (triggers WhatsApp)
│       └── whatsapp.ts                   # Trigger CRUD operations
├── app/dashboard/
│   └── whatsapp-triggers/
│       └── page.tsx                      # Admin UI for managing triggers
└── prisma/
    └── schema.prisma                     # WhatsAppTrigger model
```

## 🎯 PHP to TypeScript Mapping

### PHP Code (Original)

```php
// lead_view.php - Status change
if ($_POST["action"] === "status") {
    $status = $_POST["status"];

    $pdo->prepare("UPDATE leads SET status=? WHERE id=?")
        ->execute([$status, $id]);

    require_once __DIR__ . "/includes/whatsapp_trigger.php";
    trigger_whatsapp_on_status($pdo, $id, $user["id"], $status, $lead);
}
```

### TypeScript Code (Our Implementation)

```typescript
// lead.ts - updateStatus mutation
updateStatus: protectedWorkspaceProcedure
  .input(z.object({ id: z.string(), status: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Update lead status
    const lead = await ctx.db.lead.update({
      where: { id: input.id },
      data: { status: input.status },
    });

    // Trigger WhatsApp
    await triggerWhatsAppOnStatus(
      ctx.db,
      input.id,
      ctx.session.user.id,
      input.status,
      ctx.workspaceId,
    );
  });
```

## 🔧 Configuration

### 1. Environment Variables

```env
# .env
AISENSY_API_URL=https://backend.aisensy.com/campaign/t1/api/v2
AISENSY_API_KEY=your-api-key-here
```

### 2. Create AISensy Campaign

1. Go to AISensy Dashboard → Campaigns
2. Create new campaign: **"Congratulations on Enrollment"**
3. Add template with 2 parameters:
   - Parameter 1: `{{FirstName}}`
   - Parameter 2: `{{CourseInterested}}`
4. Save and approve template

### 3. Create WhatsApp Trigger

**Option A: Via UI (Recommended)**

1. Navigate to **WhatsApp Triggers** page
2. Click **"Create Demo Trigger"** button
3. Or click **"Add Trigger"** for custom configuration

**Option B: Via Script**

```bash
npx tsx scripts/create-demo-whatsapp-triggers.ts
```

**Option C: Via Prisma Studio**

```bash
npx prisma studio
```

Then manually add trigger in `WhatsAppTrigger` table.

## 📋 Demo Trigger Configuration

### Trigger: Congratulations on Enrollment

```json
{
  "status": "CONVERTED",
  "isEnabled": true,
  "campaignName": "Congratulations on Enrollment",
  "source": "EasyLearning CRM",
  "templateParamsJson": "[\"{{FirstName}}\", \"{{CourseInterested}}\"]",
  "paramsFallbackJson": "{\"FirstName\": \"Student\", \"CourseInterested\": \"our program\"}"
}
```

**What happens:**

- When lead status changes to **CONVERTED**
- System sends WhatsApp using campaign **"Congratulations on Enrollment"**
- Template receives: `["John", "Web Development"]`
- If data missing, uses fallbacks: `["Student", "our program"]`

## 🔄 Trigger Flow Example

```
Lead Status Changed: NEW → CONVERTED
        ↓
Check WhatsAppTrigger table
        ↓
Found active trigger for CONVERTED
        ↓
Get lead: { firstName: "John", phone: "9876543210", courseInterested: "React" }
        ↓
Normalize phone: "9876543210" → "919876543210"
        ↓
Replace params: ["{{FirstName}}", "{{CourseInterested}}"] → ["John", "React"]
        ↓
Call AISensy API:
{
  campaignName: "Congratulations on Enrollment",
  destination: "919876543210",
  templateParams: ["John", "React"]
}
        ↓
Log Activity: "WhatsApp sent via Congratulations on Enrollment"
```

## 📱 Available Template Variables

| Variable               | Description          | Example                 |
| ---------------------- | -------------------- | ----------------------- |
| `{{FirstName}}`        | Lead's first name    | "John"                  |
| `{{Phone}}`            | Lead's phone number  | "919876543210"          |
| `{{Email}}`            | Lead's email         | "john@example.com"      |
| `{{Source}}`           | Lead source          | "Website"               |
| `{{CourseInterested}}` | Course interested in | "Web Development"       |
| `{{FeedbackLink}}`     | Custom feedback URL  | "https://forms.gle/abc" |
| `{{Amount}}`           | Amount/Price         | "₹10,000"               |
| `{{Date}}`             | Current date         | "28/12/2024"            |

## 🎨 Multiple Status Examples

You can create triggers for any status:

### Example 1: Follow Up Done

```json
{
  "status": "FOLLOW_UP_DONE",
  "campaignName": "Get Feedback",
  "templateParamsJson": "[\"{{FirstName}}\", \"{{FeedbackLink}}\"]"
}
```

### Example 2: Not Connected

```json
{
  "status": "NOT_CONNECTED",
  "campaignName": "Feedback Call Not Connected",
  "templateParamsJson": "[\"{{FirstName}}\"]"
}
```

### Example 3: Qualified

```json
{
  "status": "QUALIFIED",
  "campaignName": "Course Brochure and Pricing",
  "templateParamsJson": "[\"{{FirstName}}\", \"{{CourseInterested}}\", \"{{Amount}}\"]"
}
```

## 🔍 Phone Normalization

Matches PHP implementation:

```typescript
// PHP: if (strlen($phone) == 10) { $phone = "91" . $phone; }

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return "91" + cleaned; // Add India country code
  }

  return cleaned;
}
```

**Examples:**

- Input: `"9876543210"` → Output: `"919876543210"`
- Input: `"919876543210"` → Output: `"919876543210"` (unchanged)
- Input: `"+91 9876543210"` → Output: `"919876543210"`

## 📊 Activity Logging

Every WhatsApp trigger attempt is logged:

```typescript
await db.activity.create({
  data: {
    type: "WHATSAPP",
    subject: "WhatsApp sent via Congratulations on Enrollment",
    description: "WhatsApp message sent successfully to 919876543210",
    leadId: leadId,
    userId: userId,
    workspaceId: workspaceId,
  },
});
```

**View in UI:**

- Lead detail page → Activity tab
- Shows all WhatsApp sends with timestamps

## 🐛 Troubleshooting

### WhatsApp not sending?

1. **Check AISensy credentials**

   ```bash
   echo $AISENSY_API_URL
   echo $AISENSY_API_KEY
   ```

2. **Verify trigger is enabled**
   - Go to WhatsApp Triggers page
   - Check if trigger has green checkmark

3. **Check campaign name matches**
   - AISensy campaign: "Congratulations on Enrollment"
   - Trigger campaign: "Congratulations on Enrollment"
   - Must match exactly (case-sensitive)

4. **Check phone number**
   - Must be valid 10-digit Indian number
   - Or include country code

5. **View logs**
   ```bash
   # Server console will show:
   ✅ WhatsApp sent to 919876543210 for status CONVERTED via campaign Congratulations on Enrollment
   # Or error:
   ❌ WhatsApp failed for lead abc123: Invalid phone number
   ```

## 🔐 Security Notes

- Only **Admin** and **Manager** roles can create/edit triggers
- Triggers are workspace-scoped (isolated per workspace)
- AISensy API key stored securely in environment variables
- Phone numbers are normalized and validated before sending

## 🚦 Testing

### 1. Create Test Lead

```bash
# Via UI or API
POST /api/webhooks/lead
{
  "firstName": "Test User",
  "phone": "9999999999",
  "courseInterested": "Demo Course"
}
```

### 2. Change Status to CONVERTED

```bash
# Via UI: Lead detail page → Status dropdown → CONVERTED
# Or API:
mutation {
  updateLeadStatus(id: "lead_id", status: "CONVERTED")
}
```

### 3. Check Activity Log

- Lead detail page → Activity tab
- Should show: "WhatsApp sent via Congratulations on Enrollment"

### 4. Verify in AISensy

- AISensy Dashboard → Reports
- Should show message sent to 919999999999

## 📈 Future Enhancements

- [ ] Multiple triggers per status (currently 1-to-1)
- [ ] Conditional triggers (e.g., only if source = "Facebook")
- [ ] Delay triggers (send after X hours)
- [ ] A/B testing with different campaigns
- [ ] WhatsApp delivery status webhooks
- [ ] Rich media support (images, PDFs)
- [ ] Interactive button templates

## 📚 Related Files

- `/src/server/services/whatsapp-trigger.ts` - Core trigger logic
- `/src/server/api/routers/whatsapp.ts` - Trigger CRUD API
- `/src/server/api/routers/lead.ts` - Lead status update (triggers WhatsApp)
- `/src/app/dashboard/whatsapp-triggers/page.tsx` - Admin UI
- `/prisma/schema.prisma` - WhatsAppTrigger model definition

## 🤝 Support

For issues or questions:

1. Check server console logs
2. Verify AISensy dashboard
3. Review activity logs in lead detail
4. Check database for trigger configuration

---

**Built with ❤️ matching the PHP implementation perfectly!**
