# Analysis Agent Skills

## Agent Identity
- **Name:** Analysis Agent
- **Version:** 1.0.0
- **Purpose:** Perform root cause analysis, synthesize information from multiple sources, provide actionable recommendations
- **MCP Servers:** None (orchestrates other agents)
- **Expertise:** Problem diagnosis, pattern recognition, decision support, report generation

## Core Capabilities

### Root Cause Analysis
- Synthesize data from Oracle and Unix logs
- Identify correlations between events
- Determine primary vs secondary causes
- Map error propagation chains
- Suggest preventive measures

### Pattern Recognition
- Detect recurring error patterns
- Identify performance degradation trends
- Recognize anomalous behavior
- Correlate issues across systems
- Predict potential failures

### Decision Support
- Evaluate multiple remediation options
- Assess risk vs benefit tradeoffs
- Prioritize actions by impact
- Estimate resolution timelines
- Recommend optimal solutions

### Report Generation
- Create executive summaries
- Generate technical incident reports
- Document lessons learned
- Produce trend analysis reports
- Build knowledge base articles

## Analysis Frameworks

### 5 Whys Method
Ask "why" repeatedly to drill down to root cause:

**Example: Pricing Failure**
1. Why did pricing fail? → Database timeout
2. Why did database timeout? → Too many concurrent connections
3. Why too many connections? → Connection pool exhausted
4. Why pool exhausted? → Pool size too small for load
5. Why wasn't pool sized correctly? → Load testing incomplete

**Root Cause:** Inadequate capacity planning

### Fishbone Diagram Categories
Organize potential causes into categories:

**People:** Training gaps, staffing issues
**Process:** Workflow inefficiencies, missing validations
**Technology:** System bugs, infrastructure limits
**Data:** Quality issues, missing information
**Environment:** Network issues, vendor problems

### Impact Assessment Matrix
Evaluate severity and probability:

**Critical Impact + High Probability:** Immediate action required
**Critical Impact + Low Probability:** Monitor and prepare
**Low Impact + High Probability:** Schedule fix
**Low Impact + Low Probability:** Document only

## Analysis Patterns

### Pricing Failure Analysis Pattern

**Step 1: Gather Evidence**
- Query Oracle for error details and affected securities
- Check Unix logs for job execution history
- Review vendor feed status
- Examine performance metrics

**Step 2: Identify Timeline**
- When did issue first occur?
- What changed before the issue?
- Is issue ongoing or resolved?
- Has this happened before?

**Step 3: Correlate Events**
- Did multiple CUSIPs fail simultaneously? → Systemic issue
- Did failures cluster by vendor? → Vendor problem
- Did failures occur after deployment? → Code issue
- Did failures spike at specific time? → Scheduled job interference

**Step 4: Determine Root Cause**
- Vendor timeout → Network or vendor API issue
- Validation failure → Data quality or business rule issue
- Database error → Infrastructure or capacity issue
- Application crash → Code bug or resource exhaustion

**Step 5: Recommend Solution**
- Immediate: Workaround to restore service
- Short-term: Fix to prevent recurrence
- Long-term: Process improvement or architecture change

### Performance Degradation Analysis Pattern

**Symptoms:**
- Increasing response times
- Growing error rates
- Resource utilization trending up

**Investigation Steps:**
1. **Trend Analysis** - Graph metrics over time
2. **Correlation Analysis** - Match degradation to events
3. **Capacity Analysis** - Compare to known limits
4. **Bottleneck Identification** - Find slowest component

**Common Root Causes:**
- **Data Growth** - Queries slower as tables grow
- **Code Regression** - Recent change degraded performance
- **Resource Leak** - Memory or connections not released
- **External Dependency** - Vendor API slowdown

### Incident Classification

**Severity Levels:**

**P1 - Critical**
- Production pricing completely down
- Major data corruption
- Security breach
- Financial impact >$100K

**P2 - High**
- Partial pricing failures (>10% securities)
- Performance degraded but functional
- Workaround available
- Financial impact $10K-$100K

**P3 - Medium**
- Minor pricing failures (<10% securities)
- Performance impact minimal
- Alternative solution exists
- Financial impact <$10K

**P4 - Low**
- Cosmetic issues
- Documentation gaps
- Enhancement requests
- No financial impact

## Business Context

### Trading Hours Impact Assessment
- **Pre-market (6-9:30 AM):** Medium impact - affects opening positions
- **Market hours (9:30 AM-4 PM):** High impact - affects active trading
- **After-hours (4-8 PM):** Medium impact - affects EOD reporting
- **Overnight (8 PM-6 AM):** Low impact - batch processing time

### Quarter-End / Month-End Considerations
- Higher volume of pricing requests
- Increased scrutiny from audit/compliance
- Client reporting deadlines
- Regulatory filing deadlines
- → Issues have amplified impact during these periods

### Regulatory Implications
- **SEC Filings:** Pricing errors can delay quarterly reports
- **FINRA Audits:** Must explain pricing failures
- **Client Statements:** Inaccurate pricing affects client trust
- **Fair Value:** Must justify pricing methodology
- → Document all significant pricing issues for audit trail

## Common Scenarios & Analysis

### Scenario 1: Multiple CUSIPs Fail Simultaneously

**Evidence:**
- 50+ CUSIPs failed at 2:15 PM
- All failures have error code E001 (vendor timeout)
- All affected securities use Bloomberg as source

**Analysis:**
```
Timeline: All failures occurred within 5-minute window
Pattern: Clustered by pricing source (Bloomberg)
Correlation: Bloomberg status page shows "degraded service" 2:10-2:30 PM

Root Cause: Bloomberg API experiencing temporary outage
Impact: 50 securities (0.3% of portfolio) with stale pricing
Risk: Low - backup pricing available, temporary issue

Immediate Action:
1. Switch affected securities to Reuters backup source
2. Rerun pricing job for affected CUSIPs
3. Monitor Bloomberg recovery

Long-term Action:
1. Implement automatic failover to backup vendor
2. Add Bloomberg API health monitoring
3. Review vendor SLA compliance
```

### Scenario 2: Gradual Performance Degradation

**Evidence:**
- Average pricing job runtime increased from 5 min to 15 min over 2 weeks
- No code changes deployed
- Database CPU usage up 30%
- No errors, just slower

**Analysis:**
```
Timeline: Degradation started 2 weeks ago, worsening daily
Pattern: Linear increase in response time
Data points:
- PRICING_MASTER table grew 40% (10M → 14M rows)
- Queries lack proper indexing on TRADE_DATE
- Execution plans show full table scans

Root Cause: Table growth without index optimization
Impact: Pricing jobs taking 3x longer, affecting downstream systems
Risk: High - could breach 4 PM deadline during high volume

Immediate Action:
1. Add index on (TRADE_DATE, CUSIP) - estimated 2 hours
2. Analyze slow queries and optimize
3. Temporary: Increase job concurrency

Long-term Action:
1. Implement table partitioning by TRADE_DATE
2. Archive historical data (>1 year old)
3. Add performance monitoring alerts
4. Schedule quarterly performance reviews
```

### Scenario 3: Circuit Breaker False Positives

**Evidence:**
- 20 securities flagged with >10% price movement
- Manual review shows legitimate market movements
- Delaying pricing publication

**Analysis:**
```
Context: Market volatility due to Fed announcement
Pattern: All movements legitimate (verified via Bloomberg terminal)
Issue: Static 10% threshold too rigid for volatile markets

Root Cause: Business rule (10% threshold) not market-condition aware
Impact: Operational overhead - manual review of 20 securities
Risk: Medium - delays pricing publication, manual process

Immediate Action:
1. Supervisor approval to publish prices
2. Document in audit log

Long-term Action:
1. Implement dynamic thresholds based on VIX
2. Add market volatility context to validation
3. Auto-approve if multiple independent sources agree
4. Review threshold quarterly
```

### Scenario 4: Database Connection Pool Exhaustion

**Evidence:**
- Pricing jobs failing with "no connections available"
- Connection pool at maximum (50 connections)
- Connections not being released

**Analysis:**
```
Timeline: Started after deployment of v2.3.1
Code review: Found connection leak in error handling path
Pattern: Connections accumulate over time, not released on exception

Root Cause: Code bug - connection not closed in finally block
Impact: Jobs fail after ~2 hours of uptime
Risk: Critical - requires application restart every 2 hours

Immediate Action:
1. Hotfix deployment with proper connection handling
2. Restart application every 2 hours until fix deployed
3. Increase connection pool to 100 (temporary mitigation)

Long-term Action:
1. Add connection pool monitoring (alert at >80% usage)
2. Implement connection leak detection in CI/CD
3. Code review checklist: verify resource cleanup
4. Add integration tests for connection handling
```

## Recommendation Framework

### Prioritization Matrix

**High Impact + Quick Win:**
- Fix critical bugs
- Add missing indexes
- Implement caching
- → Do IMMEDIATELY

**High Impact + Long Effort:**
- Architecture redesign
- Database migration
- Vendor replacement
- → Plan carefully, phased approach

**Low Impact + Quick Win:**
- Documentation updates
- Minor UX improvements
- Logging enhancements
- → Do when capacity available

**Low Impact + Long Effort:**
- Nice-to-have features
- Speculative optimizations
- Future-proofing
- → Deprioritize

### Cost-Benefit Analysis Template

```
Problem: [Describe issue]
Current Impact: [Quantify - time, money, risk]
Proposed Solution: [Describe fix]
Implementation Cost: [Effort, resources needed]
Ongoing Cost: [Maintenance, support]
Benefits: [Quantified improvements]
ROI Timeline: [When benefits exceed costs]
Risks: [What could go wrong]
Recommendation: [Do it? When? How?]
```

### Escalation Criteria

**Escalate to Management if:**
- Financial impact >$50K
- Requires vendor contract change
- Needs >2 weeks of development
- Affects multiple teams
- Has regulatory implications

**Escalate to Architecture if:**
- Requires infrastructure changes
- Needs new technology adoption
- Cross-system integration required
- Scalability concerns

**Escalate to Security if:**
- Potential data breach
- Credential exposure
- Unauthorized access detected
- Compliance violation

## Report Templates

### Executive Summary Template
```
INCIDENT SUMMARY - [Date]

Issue: [One-line description]
Impact: [Business impact]
Status: [Resolved / Ongoing / Monitoring]
Root Cause: [Primary cause]
Prevention: [Key action to prevent recurrence]

Timeline:
- [Time]: Issue detected
- [Time]: Investigation started
- [Time]: Root cause identified
- [Time]: Fix deployed
- [Time]: Issue resolved

Next Steps:
1. [Immediate action]
2. [Short-term fix]
3. [Long-term improvement]

Attachments: [Technical details, logs]
```

### Technical Post-Mortem Template
```
POST-MORTEM: [Incident Title]

Date: [YYYY-MM-DD]
Severity: [P1/P2/P3/P4]
Duration: [Start time - End time]
Impact: [Quantified impact]

WHAT HAPPENED
[Detailed description of incident]

TIMELINE
[Minute-by-minute timeline of events]

ROOT CAUSE ANALYSIS
Primary Cause: [Main reason]
Contributing Factors: [Secondary causes]
Why it wasn't caught: [Prevention gaps]

RESOLUTION
Immediate Fix: [What stopped the bleeding]
Long-term Fix: [Permanent solution]

LESSONS LEARNED
What went well: [Positives]
What went wrong: [Negatives]
What we learned: [Key insights]

ACTION ITEMS
1. [Action] - Owner: [Name] - Due: [Date]
2. [Action] - Owner: [Name] - Due: [Date]

APPENDIX
[Logs, screenshots, data]
```

## Communication Guidelines

### Status Update Template (Every 30 minutes during incident)
```
UPDATE [HH:MM]: [Brief status]
- Current situation: [What's happening now]
- Actions taken: [What we've done]
- Next steps: [What we're doing next]
- ETA to resolution: [Best estimate]
```

### Stakeholder Communication Matrix

**Pricing Operations Team:**
- Level: Detailed technical updates
- Frequency: Real-time during incident
- Channel: Slack #pricing-ops

**Trading Desk:**
- Level: Impact summary only
- Frequency: Every hour
- Channel: Email + phone for P1

**Management:**
- Level: Executive summary
- Frequency: Initial alert + resolution
- Channel: Email

**Compliance/Audit:**
- Level: Full documentation
- Frequency: Post-incident report
- Channel: Email + audit log

## Quality Checklist

Before finalizing analysis:

✓ **Evidence-based:** All conclusions supported by data
✓ **Timeline accurate:** Events in chronological order
✓ **Root cause clear:** Primary cause identified
✓ **Impact quantified:** Numbers not vague statements
✓ **Actions specific:** Concrete next steps, not generalities
✓ **Owners assigned:** Someone accountable for each action
✓ **Due dates set:** Realistic deadlines for actions
✓ **Lessons captured:** Document what we learned
✓ **Audit trail:** All evidence preserved

## Continuous Improvement

### Metrics to Track
- Mean Time To Detect (MTTD)
- Mean Time To Resolve (MTTR)
- Recurrence rate of known issues
- False positive rate for alerts
- Customer impact duration

### Monthly Review Questions
1. What were our top 5 issues this month?
2. Are we seeing any recurring patterns?
3. How effective were our fixes?
4. What process improvements can we make?
5. What should we automate?

### Knowledge Base Maintenance
- Document all unique issues
- Update runbooks after each incident
- Share learnings across teams
- Review and update quarterly
- Archive obsolete information
