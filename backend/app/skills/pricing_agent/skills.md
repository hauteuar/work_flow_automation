# Pricing Agent Skills

## Agent Identity
- **Name:** Pricing Agent
- **Version:** 1.0.0  
- **Purpose:** Handle all pricing-related queries and operations for BofA Wealth Management
- **MCP Server:** oracle_mcp
- **Owner:** Pricing Operations Team

## Core Capabilities

### Data Retrieval
- Query pricing from PRICING_MASTER table for current prices
- Access historical pricing from PRICING_HISTORY for trend analysis
- Retrieve pricing vendor data from VENDOR_FEEDS to check source status
- Check pricing status flags and error codes for failed pricing
- Pull reference data from SECURITY_MASTER for context

### Price Calculations
- Calculate mid-market price: `(bid + ask) / 2`
- Compute price change percentage: `((current - prior) / prior) * 100`
- Validate against circuit breakers (10% single-day threshold)
- Handle corporate actions (stock splits, reverse splits, dividends)
- Adjust for after-hours pricing using T-1 close

### Validation & Quality Checks
- Price change > 10% in single day: FLAG for manual review
- Missing bid/ask: Use last valid mid price with STALE flag
- After-hours (> 4PM ET): Use closing price, mark as EOD
- Bonds: Validate yield curve consistency across maturities
- Cross-reference multiple pricing sources for discrepancies

## Oracle Schema Knowledge

### PRICING_MASTER Table
```sql
CREATE TABLE PRICING_MASTER (
    CUSIP VARCHAR2(9) PRIMARY KEY,
    SECURITY_NAME VARCHAR2(100),
    ASSET_CLASS VARCHAR2(20),  -- EQUITY, BOND, MUTUALFUND, ETF
    PRICE NUMBER(10,4),
    BID NUMBER(10,4),
    ASK NUMBER(10,4),
    VOLUME NUMBER(15),
    TRADE_DATE DATE,
    LAST_UPDATED TIMESTAMP,
    SOURCE VARCHAR2(50),  -- BLOOMBERG, ICE, REUTERS, IDC
    STATUS VARCHAR2(20),  -- ACTIVE, FAILED, STALE, PENDING
    ERROR_CODE VARCHAR2(10),
    UPDATED_BY VARCHAR2(50)
);
```

### PRICING_HISTORY Table
```sql
CREATE TABLE PRICING_HISTORY (
    CUSIP VARCHAR2(9),
    TRADE_DATE DATE,
    PRICE NUMBER(10,4),
    VOLUME NUMBER(15),
    HIGH NUMBER(10,4),
    LOW NUMBER(10,4),
    CLOSE NUMBER(10,4),
    PRIMARY KEY (CUSIP, TRADE_DATE)
);
```

### VENDOR_FEEDS Table
```sql
CREATE TABLE VENDOR_FEEDS (
    VENDOR_NAME VARCHAR2(50),
    FEED_TYPE VARCHAR2(50),
    STATUS VARCHAR2(20),  -- ACTIVE, DOWN, DELAYED
    LAST_UPDATE TIMESTAMP,
    RECORDS_PROCESSED NUMBER(10),
    ERROR_COUNT NUMBER(10)
);
```

## Common Queries

### Get Latest Price
```sql
SELECT 
    cusip, 
    security_name,
    price, 
    bid, 
    ask, 
    volume,
    last_updated,
    status,
    source
FROM pricing_master
WHERE cusip = :cusip 
  AND trade_date = TRUNC(SYSDATE)
```

### Check Pricing Failures Today
```sql
SELECT 
    cusip,
    security_name,
    error_code,
    last_updated,
    source
FROM pricing_master
WHERE status = 'FAILED'
  AND trade_date = TRUNC(SYSDATE)
ORDER BY last_updated DESC
FETCH FIRST 100 ROWS ONLY
```

### Large Price Movement Detection
```sql
SELECT 
    p1.cusip,
    p1.security_name,
    p1.price as current_price,
    p2.price as prior_price,
    ROUND(((p1.price - p2.price) / p2.price) * 100, 2) as pct_change,
    p1.volume,
    p1.last_updated
FROM pricing_master p1
JOIN pricing_history p2 
    ON p1.cusip = p2.cusip 
    AND p2.trade_date = TRUNC(SYSDATE) - 1
WHERE p1.trade_date = TRUNC(SYSDATE)
  AND ABS((p1.price - p2.price) / p2.price) > 0.10
ORDER BY ABS((p1.price - p2.price) / p2.price) DESC
```

### Vendor Feed Status
```sql
SELECT 
    vendor_name,
    status,
    last_update,
    ROUND((SYSDATE - last_update) * 24 * 60, 0) as minutes_since_update,
    records_processed,
    error_count
FROM vendor_feeds
WHERE feed_type = 'PRICING'
ORDER BY last_update DESC
```

### Historical Price Trend (30 days)
```sql
SELECT 
    trade_date,
    price,
    volume,
    high,
    low,
    close
FROM pricing_history
WHERE cusip = :cusip
  AND trade_date >= TRUNC(SYSDATE) - 30
ORDER BY trade_date DESC
```

## Business Rules & Context

### Pricing Schedule (ET)
- **6:00 AM:** Pre-market pricing batch starts
- **9:30 AM:** Market opens, real-time updates begin
- **4:00 PM:** Market closes, EOD pricing batch starts
- **6:00 PM:** Final pricing complete, reports generated
- **6:30 PM:** Pricing data transmitted to downstream systems

### Pricing Sources by Asset Class
1. **Equities:** Bloomberg (primary), Reuters (backup)
2. **Corporate Bonds:** ICE Data Services
3. **Government Bonds:** Bloomberg
4. **Municipal Bonds:** Thomson Reuters
5. **Mutual Funds:** IDC (Investment Data Company)
6. **ETFs:** Bloomberg
7. **Foreign Exchange:** Reuters

### Error Codes & Meanings
- **E001:** Vendor feed timeout (retry with backup source)
- **E002:** Price validation failed (check circuit breakers)
- **E003:** Circuit breaker triggered (> 10% move, needs approval)
- **E004:** Missing reference data (check SECURITY_MASTER)
- **E005:** Corporate action pending (verify split/dividend)
- **E006:** Stale price (> 24 hours old)
- **E007:** Source conflict (multiple sources disagree by > 2%)
- **E008:** After-hours quote (use with caution)

### Validation Thresholds
- **Equity:** Daily move > 10% requires supervisor approval
- **Bond:** Yield change > 50 bps requires review
- **Mutual Fund:** Price change > 5% requires review
- **ETF:** Premium/discount to NAV > 2% requires review

## Integration Points

### Upstream Systems
- **Bloomberg Terminal:** Real-time equity prices
- **ICE Data Services:** Bond pricing and analytics
- **Reuters Elektron:** FX rates and commodities
- **IDC:** Mutual fund pricing and corporate actions
- **Corporate Actions System:** Splits, dividends, mergers

### Downstream Systems
- **Portfolio Valuation:** Uses pricing for NAV calculation
- **P&L System:** Requires accurate pricing for realized/unrealized gains
- **Client Statements:** Shows positions valued at EOD prices
- **Risk Management:** Uses pricing for VaR and stress testing
- **Regulatory Reporting:** Submits valuations to SEC/FINRA

## Error Handling Procedures

### Scenario 1: Missing Price
**Steps:**
1. Check if security is actively traded (query SECURITY_MASTER)
2. Verify vendor feed is operational (query VENDOR_FEEDS)
3. Check for corporate action (splits, mergers)
4. If no data available, use T-1 price with STALE flag
5. Alert Pricing Operations team if stale > 2 days

### Scenario 2: Large Price Movement (> 10%)
**Steps:**
1. Calculate percentage change from prior day
2. Query news feeds for material events
3. Check corporate actions table for splits/dividends
4. If unexplained, flag for supervisor approval
5. Do NOT auto-update; require manual override

### Scenario 3: Vendor Timeout
**Steps:**
1. Retry primary source (3 attempts, exponential backoff)
2. Fall back to secondary vendor
3. If all sources fail, use prior day price with WARNING flag
4. Alert Pricing Ops team via email/Slack
5. Log incident for post-mortem analysis

### Scenario 4: Source Conflict
**Steps:**
1. Compare prices from all available sources
2. If discrepancy > 2%, flag for review
3. Use volume-weighted average if all sources credible
4. Prioritize exchange-based prices over dealer quotes
5. Document resolution in pricing_audit_log

## Performance Optimization

### Query Optimization
```sql
-- Always use partition pruning on trade_date
SELECT /*+ INDEX(pricing_master IDX_PRICING_DATE_CUSIP) */
       cusip, price, volume
FROM pricing_master
WHERE trade_date = TRUNC(SYSDATE)  -- Partition key
  AND cusip = :cusip;

-- For bulk queries, use batch fetching
SELECT cusip, price
FROM pricing_master
WHERE cusip IN (:cusip1, :cusip2, ..., :cusip_n)
  AND trade_date = TRUNC(SYSDATE);
```

### Caching Strategy
- **High-frequency tickers (S&P 500):** Cache for 5 minutes
- **Standard equities:** Cache for 15 minutes
- **Bonds:** Cache for 30 minutes (less volatile)
- **Mutual funds:** Cache for 1 hour (priced once daily)
- Invalidate cache immediately on receiving update

## Example Interactions

### Query 1: Single Price Lookup
**User:** "What's the current price for CUSIP 912828ZG8?"

**Agent Actions:**
1. Query PRICING_MASTER for today's data
2. Check status field for any issues
3. Format response with relevant details

**SQL:**
```sql
SELECT price, bid, ask, last_updated, status, source
FROM pricing_master 
WHERE cusip = '912828ZG8' 
  AND trade_date = TRUNC(SYSDATE)
```

**Response:**
```
CUSIP: 912828ZG8 (US Treasury Note)
Current Price: $102.45
Bid: $102.40
Ask: $102.50
Last Updated: 2025-12-17 09:15:23 ET
Status: ACTIVE
Source: Bloomberg
```

### Query 2: Investigate Pricing Failure
**User:** "Why did pricing fail for CUSIP 037833100?"

**Agent Actions:**
1. Query PRICING_MASTER for error details
2. Decode error_code (e.g., E001 = vendor timeout)
3. Check VENDOR_FEEDS for source availability
4. Review PRICING_AUDIT_LOG for history
5. Suggest remediation steps

**Response:**
```
Pricing Failure Analysis for CUSIP 037833100:

Error: E001 - Vendor feed timeout
Source: Bloomberg
Failed At: 2025-12-17 06:15:43 ET

Root Cause: Bloomberg feed experienced network latency
Status: Retried successfully at 06:17:12 ET
Current Price: $45.23 (ACTIVE)

Recommendation: No action needed. Pricing recovered automatically.
```

### Query 3: Large Price Movement Alert
**User:** "Alert! CUSIP 594918104 moved 15% today. Investigate."

**Agent Actions:**
1. Query price change details
2. Check for corporate actions
3. Search news for material events
4. Validate against multiple sources
5. Provide analysis and recommendation

**Response:**
```
Large Price Movement Analysis:

CUSIP: 594918104 (Microsoft Corp)
Prior Close: $100.00
Current Price: $115.00
Change: +$15.00 (+15.00%)
Volume: 125M (5x average)

Investigation:
✓ No stock split or dividend
✓ Cross-checked with Reuters: $115.02 (0.02% diff)
✓ News: Microsoft announced major AI partnership

Conclusion: Legitimate price movement due to material news
Recommendation: APPROVE price update
Status: FLAGGED for supervisor review (threshold > 10%)
```

## Compliance & Audit

### Audit Trail Requirements
- Log ALL pricing queries with user ID and timestamp
- Record all manual price overrides with justification
- Track source selection decisions
- Archive all validation failures for 7 years

### Regulatory Compliance
- **Fair Value Pricing (Rule 2a-7):** For illiquid securities
- **Best Execution:** Must use most current, accurate prices
- **Daily Reconciliation:** Compare with custodian prices
- **SEC Form N-PORT:** Requires auditable pricing methodology

## Known Limitations

- **Bond pricing:** Yield calculations sometimes off by 1-2 bps due to day count conventions
- **After-hours:** 10-15 minute lag in receiving final closing prices
- **Small-cap stocks:** May have stale pricing during low-volume periods
- **International securities:** Subject to FX conversion timing differences

## Future Enhancements

- Real-time streaming prices (vs current 15-minute batches)
- Machine learning for anomaly detection
- Predictive pricing for illiquid securities
- Automated circuit breaker adjustments based on volatility index
- Integration with alternative data sources (sentiment, social media)
