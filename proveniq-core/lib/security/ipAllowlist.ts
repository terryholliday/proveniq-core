import { NextRequest } from "next/server";
import { forbidden } from "@/lib/api/response";

export interface IpAllowlistConfig {
  enabled: boolean;
  allowedIps: string[];
  allowedCidrs: string[];
  bypassForRoles?: string[];
}

const defaultConfig: IpAllowlistConfig = {
  enabled: false,
  allowedIps: [],
  allowedCidrs: [],
  bypassForRoles: ["ADMIN"],
};

let config: IpAllowlistConfig = { ...defaultConfig };

export function configureIpAllowlist(newConfig: Partial<IpAllowlistConfig>) {
  config = { ...config, ...newConfig };
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

export function ipToNumber(ip: string): number {
  const parts = ip.split(".");
  if (parts.length !== 4) return 0;
  
  return parts.reduce((acc, part, index) => {
    return acc + (parseInt(part, 10) << (8 * (3 - index)));
  }, 0);
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  const [cidrIp, cidrMask] = cidr.split("/");
  const mask = parseInt(cidrMask, 10);
  
  if (isNaN(mask) || mask < 0 || mask > 32) return false;
  
  const ipNum = ipToNumber(ip);
  const cidrIpNum = ipToNumber(cidrIp);
  const maskNum = ~((1 << (32 - mask)) - 1);
  
  return (ipNum & maskNum) === (cidrIpNum & maskNum);
}

export function isIpAllowed(ip: string): boolean {
  if (!config.enabled) return true;
  
  if (config.allowedIps.includes(ip)) return true;
  
  for (const cidr of config.allowedCidrs) {
    if (isIpInCidr(ip, cidr)) return true;
  }
  
  return false;
}

export function ipAllowlistMiddleware() {
  return async function middleware(request: NextRequest, userRole?: string) {
    if (!config.enabled) return null;
    
    if (userRole && config.bypassForRoles?.includes(userRole)) {
      return null;
    }
    
    const clientIp = getClientIp(request);
    
    if (!isIpAllowed(clientIp)) {
      return forbidden(`Access denied from IP: ${clientIp}`);
    }
    
    return null;
  };
}

export function addAllowedIp(ip: string) {
  if (!config.allowedIps.includes(ip)) {
    config.allowedIps.push(ip);
  }
}

export function removeAllowedIp(ip: string) {
  config.allowedIps = config.allowedIps.filter((i) => i !== ip);
}

export function addAllowedCidr(cidr: string) {
  if (!config.allowedCidrs.includes(cidr)) {
    config.allowedCidrs.push(cidr);
  }
}

export function removeAllowedCidr(cidr: string) {
  config.allowedCidrs = config.allowedCidrs.filter((c) => c !== cidr);
}

export function getAllowlist(): IpAllowlistConfig {
  return { ...config };
}
