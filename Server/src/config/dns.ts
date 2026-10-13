import { setServers } from "node:dns";

// Windows ICS / Mobile Hotspot can leave Node's resolver pointed at a dead
// 127.0.0.1 DNS proxy, breaking mongodb+srv:// SRV lookups (querySrv
// ECONNREFUSED). Import this module once, before mongoose.connect(), to pin
// resolvers for c-ares lookups only (SRV/TXT/MX); dns.lookup()/getaddrinfo
// are unaffected. Override with the DNS_SERVERS env var if needed.
setServers(process.env.DNS_SERVERS?.split(",") ?? ["8.8.8.8", "1.1.1.1"]);
