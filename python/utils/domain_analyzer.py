import sys
import json
import whois
import dns.resolver
from urllib.parse import urlparse
import traceback

def log_error(e):
    """Prints detailed error information to stderr."""
    print(f"DOMAIN ANALYZER ERROR: {e}", file=sys.stderr)
    print(traceback.format_exc(), file=sys.stderr)

def get_root_domain(url):
    """Extracts the root domain (e.g., 'github.com') from a full URL."""
    try:
        parsed_url = urlparse(url)
        domain_parts = parsed_url.netloc.split('.')
        if len(domain_parts) >= 2:
            return f"{domain_parts[-2]}.{domain_parts[-1]}"
    except Exception:
        return None
    return None

def get_whois_info(domain):
    """Performs a WHOIS lookup and extracts key information."""
    whois_results = {}
    try:
        w = whois.whois(domain, quiet=True)

        if w is None or not w.registrar:
            raise Exception("No WHOIS data returned.")

        if w.registrar:
            whois_results['registrar'] = w.registrar
        if w.creation_date:
            date_val = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
            whois_results['creation_date'] = date_val.strftime('%Y-%m-%d %H:%M:%S')
        if w.expiration_date:
            date_val = w.expiration_date[0] if isinstance(w.expiration_date, list) else w.expiration_date
            whois_results['expiration_date'] = date_val.strftime('%Y-%m-%d %H:%M:%S')
        if w.name_servers:
            unique_servers = sorted(list(set([s.lower() for s in w.name_servers])))
            whois_results['name_servers'] = unique_servers
            
    except Exception as e:
        log_error(f"WHOIS lookup for {domain} failed: {e}")
        whois_results['error'] = "Could not retrieve valid WHOIS information."
        
    return whois_results

def get_dns_records(domain):
    """Performs DNS lookups for common record types."""
    dns_results = {}
    record_types = ['A', 'AAAA', 'MX', 'TXT']
    
    for record_type in record_types:
        try:
            answers = dns.resolver.resolve(domain, record_type)
            dns_results[record_type] = sorted([rdata.to_text() for rdata in answers])
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            continue
        except Exception:
            dns_results[record_type] = ["Error querying record."]
            
    return dns_results

def main(url):
    """Main function to coordinate analysis and print JSON output."""
    root_domain = get_root_domain(url)
    
    if not root_domain:
        print(json.dumps({"status": "error", "message": "Invalid URL provided."}))
        return

    final_results = {
        "domain": root_domain,
        "whois": get_whois_info(root_domain),
        "dns": get_dns_records(root_domain)
    }

    print(json.dumps(final_results, indent=2))

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            main(sys.argv[1])
        else:
            print(json.dumps({"status": "error", "message": "No URL provided."}))
    except Exception as e:
        log_error(e)
        print(json.dumps({"status": "error", "message": str(e)}))