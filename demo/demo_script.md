# Demo Script - Pricing Workflow Automation POC

## Demo Flow (10 minutes)

### Setup (Before Demo)
1. Ensure all services are running: `docker-compose up -d`
2. Check health: `curl http://localhost:8000/health`
3. Open frontend: `http://localhost:3000`
4. Have demo data loaded in Oracle

---

## Part 1: File Inquiry (3 min)

### Scenario: Check if Bloomberg file arrived

**You say:**
> "Did we receive the Bloomberg pricing file today?"

**What happens:**
1. LLM determines workflow type: `file_inquiry`
2. Extracts entities: `vendor=BLOOMBERG, date=today`
3. Unix MCP checks `/app/pricing/inbox/`
4. Unix MCP checks archive
5. Oracle MCP queries `FILE_PROCESSING_LOG`
6. LLM analyzes and responds

**Expected Response:**
```
Yes, the Bloomberg pricing file (BBG_PRICING_20251217.csv) was received at 6:02 AM 
and processed successfully by 6:15 AM.

Processing Summary:
- File size: 52 MB
- Total records: 45,230
- Successfully priced: 45,103
- Rejections: 127

The file has been archived to /app/pricing/archive/2025/12/
```

---

## Part 2: CUSIP Investigation (3 min)

### Scenario: Why is a security not priced?

**You say:**
> "Why is CUSIP 912828ZG8 not priced today?"

**What happens:**
1. LLM determines workflow type: `cusip_status`
2. Extracts entity: `cusip=912828ZG8`
3. Oracle MCP checks `PRICING_MASTER` → not found
4. Oracle MCP checks `PRICING_REJECTS` → found!
5. Unix MCP greps logs for details
6. Oracle MCP gets pricing history
7. LLM analyzes root cause

**Expected Response:**
```
CUSIP 912828ZG8 was rejected during today's pricing run.

Rejection Details:
- Rejection Code: INVALID_MATURITY
- Reason: Maturity date '2099-99-99' in source file is invalid
- Source: Bloomberg pricing file
- Time: 6:15 AM

Historical Context:
- This security was successfully priced yesterday at $101.23
- No pricing issues in the past 7 days

Root Cause:
This appears to be a data quality issue in Bloomberg's source file. 
The maturity date format suggests a data corruption during transmission.

Recommendation:
1. Contact Bloomberg vendor support (priority ticket)
2. For urgent needs, consider using yesterday's price with manual override
3. Note: 126 other securities from Bloomberg also rejected with same error
```

---

## Part 3: Missing File Investigation (3 min)

### Scenario: ICE 2PM file is missing

**You say:**
> "The ICE 2PM pricing file is missing, investigate"

**What happens:**
1. LLM determines workflow type: `file_processing`
2. Extracts: `vendor=ICE, time=2PM`
3. Unix MCP checks inbox → not there
4. Unix MCP checks archive → not there
5. Oracle MCP queries processing log → no recent ICE files
6. Unix MCP checks job processes
7. Unix MCP tails scheduler logs
8. LLM determines root cause

**Expected Response:**
```
The ICE 2PM pricing file has not arrived.

Investigation Results:
- File not in inbox: /app/pricing/inbox/
- File not in archive
- No processing records in database for today
- Expected filename: ICE_PRICING_20251217_1400.txt
- Last ICE file received: ICE_PRICING_20251216_1700.txt (yesterday 5PM)

Job Status:
- ICE processing job is not running
- Scheduler shows job is queued, waiting for file

Analysis:
The file has not been delivered by ICE vendor. This is NOT a system issue.

Next Steps:
1. Check ICE vendor status page
2. Contact ICE vendor support: support@ice.com
3. Verify SFTP connectivity: sftp.ice.com
4. Expected delivery time was 2:05 PM EST (currently 2:45 PM - 40 min late)
5. Set up alert if file doesn't arrive by 3:00 PM
```

---

## Part 4: Rejection Analysis (1 min)

**You say:**
> "Analyze today's pricing rejections"

**Expected Response:**
```
Today's Rejection Summary (December 17, 2025):

Total Rejections: 456 (vs. avg: 150) ⚠️ ABNORMAL

Top Rejection Reasons:
1. INVALID_PRICE: 234 rejections (up 300% from average)
   - All from Bloomberg file
   - All municipal bonds
   - Sample CUSIPs: 912828ZG8, 912828ZH6, 912828ZI4

2. INVALID_MATURITY: 127 rejections (normal)
3. DUPLICATE_RECORD: 95 rejections (normal)

Analysis:
Systematic data quality issue with Bloomberg municipal bond pricing.
Appears to be vendor-side problem affecting a specific asset class.

Impact:
- 456 securities cannot be valued for today's NAV calculation
- Primarily affects municipal bond portfolios
- Estimated portfolio impact: $2.3B in holdings

Recommendation:
URGENT - Escalate to Bloomberg immediately.
Consider using IDC as alternate price source for municipals today.
```

---

## Demo Highlights

### Show the Canvas (Drag & Drop)

While the above workflows run automatically, show how they can be built visually:

1. **Open Workflow Canvas**
2. **Drag nodes:**
   - Unix MCP: Check Inbox
   - Oracle MCP: Query Log
   - LLM: Analyze
   - Output: Response

3. **Connect nodes** with arrows

4. **Save as template:** "File Inquiry Workflow v1"

---

## Technical Highlights to Mention

1. **Real Enterprise Integration**
   - Actual Oracle database queries
   - Real SSH connections to Unix servers
   - Production-like file paths and table schemas

2. **AI-Powered**
   - LLM understands natural language
   - Determines workflow automatically
   - Analyzes results intelligently
   - Provides business-context responses

3. **MCP Architecture**
   - Modular, extensible servers
   - Easy to add new integrations (Jira, ServiceNow, etc.)
   - Standard protocol

4. **Enterprise Ready**
   - Audit logging
   - Error handling
   - Connection pooling
   - Health checks

---

## Q&A Prep

**Q: How do you add a new MCP server?**
A: Create new Python file inheriting from BaseMCPServer, register tools, done!

**Q: How long to add a new vendor file type?**
A: Add to skills/unix_paths.md, LLM picks it up automatically

**Q: Can it handle complex multi-step workflows?**
A: Yes, orchestrator can chain 10+ MCP calls with LLM analysis between steps

**Q: Security concerns?**
A: Read-only DB queries, restricted SSH commands, audit logging, secrets management

**Q: Integration with existing tools?**
A: API-first design, can integrate with Slack, Teams, ServiceNow, etc.

**Q: Cost?**
A: Uses your existing GPU server, no new LLM costs

---

## Closing Points

1. **Saves Time:** Manual investigation takes 30+ minutes, this takes 10 seconds
2. **Reduces Errors:** Consistent analysis, no tribal knowledge needed
3. **Scales:** Same agent handles all vendors, all securities, all scenarios
4. **Extensible:** Easy to add new MCPs, new workflows, new data sources
5. **Production-Ready:** Error handling, logging, monitoring built-in

**Next Steps:**
- Pilot with pricing ops team (2 weeks)
- Add 3 more MCP servers (Jira, Email, Reporting)
- Build workflow library (20+ common patterns)
- Deploy to production (1 month)
