# WAP Connector Setup Guide

## Overview

The load predictor connects directly to **StarRocks/WAP** to query meeting data from Iceberg tables. The connector is based on the pattern from `starrocks_test.py` and fully functional.

## Prerequisites

1. **Cisco VPN Access** - Required to reach starrocks-prod.webex.com
2. **StarRocks Credentials** - Your Cisco username and password
3. **Network Access** - Port 9030 to starrocks-prod.webex.com

## Configuration

### Step 1: Set Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
LP_WAP_HOST=starrocks-prod.webex.com
LP_WAP_PORT=9030
LP_WAP_USERNAME=your_cisco_username
LP_WAP_PASSWORD=your_cisco_password
LP_WAP_SSL_DISABLED=false
LP_WAP_SSL_VERIFY_CERT=true
LP_WAP_SSL_VERIFY_IDENTITY=false
LP_WAP_SSL_CA=/etc/ssl/cert.pem
```

### Step 2: Install Dependencies

```bash
pip install -e .
```

This installs `mysql-connector-python` required for StarRocks connection.

### Step 3: Test Connection

```bash
python -m load_predictor generate-curves \
  --env cprod \
  --region AMER \
  --weeks-back 4
```

## Supported Environments & Regions

### cprod
- **AMER**: uscentral1, useast1, uswest1 stacks
- **EMEAR**: euwest1, euwest4 stacks
- **APAC**: apnortheast1, apsoutheast1 stacks

### cstage
- **AMER**: useast1, uswest2

### cint
- **AMER**: uscentral1, rswearin stacks

## WAP Connector Details

### Class: WAPConnector

**Connection**:
- Uses MySQL connector (StarRocks-compatible)
- SSL/TLS for secure connection
- Clear password authentication

**Methods**:

```python
connector.query_meetings_data(
    env="cprod",
    region="AMER",
    weeks_back=52,
    include_test=False
)
# Returns: pd.DataFrame with columns [timestamp, count]

connector.query_aggregated_metrics(env="cprod", region="AMER")
# Returns: dict with total_meetings, total_events, date_range
```

### Query Details

The connector queries the Iceberg table:
```
iceberg.wap_udp_roma_prod_useast1.voicea_legacy_metrics
```

**Filters**:
- `source = 'WebexAssistant'` - Only Webex Assistant meetings
- `isTest = false` (by default) - Exclude test meetings
- `meetingId IS NOT NULL` - Valid meetings only
- Date range: Past N weeks

**Aggregation**:
- Groups by `_timestamp` (1-minute granularity)
- Counts meetings per minute slot

## Troubleshooting

### Connection Refused
**Issue**: `Connection refused` or timeout  
**Solution**:
- Ensure VPN is connected
- Check firewall allows port 9030
- Verify host/port in .env

### Authentication Failed
**Issue**: `Access denied for user`  
**Solution**:
- Verify username and password in .env
- Confirm credentials on StarRocks (may have changed)
- Try connecting manually with mysql CLI

### SSL Certificate Issues
**Issue**: `SSL: CERTIFICATE_VERIFY_FAILED`  
**Solution**:
- Verify `/etc/ssl/cert.pem` exists
- Try `LP_WAP_SSL_VERIFY_CERT=false` (dev only)
- Update system certificates

### No Data Returned
**Issue**: Query succeeds but returns 0 rows  
**Solution**:
- Check environment/region names are correct
- Try different `weeks_back` value
- Verify data exists for that date range in WAP
- Check stack names match expected pattern

## Integration with Workflow

The `generate-curves` command is used in GitHub Actions:

```yaml
- name: Generate curves
  run: python -m load_predictor generate-curves --env ${{ inputs.env }}
  env:
    LP_WAP_USERNAME: ${{ secrets.WAP_USERNAME }}
    LP_WAP_PASSWORD: ${{ secrets.WAP_PASSWORD }}
```

## Performance Considerations

- **Query Time**: Typically 5-60 seconds depending on data volume
- **Data Size**: ~50M rows per year for production
- **Aggregation**: Curve building is fast (in-memory)
- **Memory**: ~500MB for full year of data

## Security

- ✅ Credentials stored in `.env` (git-ignored)
- ✅ SSL/TLS encryption by default
- ✅ Certificate validation enabled
- ✅ No credentials in logs
- ✅ Connection closed properly after use
