import type { NextConfig } from "next";
import bundle from "./lib/bitregalo/bitregalo.json";

// The public network is an ordinary workspace whose pages live at /app instead of /app/t/{id}.
const PUBLIC = process.env.NEXT_PUBLIC_PUBLIC_WORKSPACE ?? String((bundle.deployments as { publicTenantId?: number }).publicTenantId ?? 0);

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Pages renamed in October 2026; old links keep working.
      { source: "/app/t/:tenant/rfps/:path*", destination: "/app/t/:tenant/requests/:path*", permanent: true },
      { source: "/app/t/:tenant/offers/:path*", destination: "/app/t/:tenant/listings/:path*", permanent: true },
      { source: "/app/t/:tenant/sales/:path*", destination: "/app/t/:tenant/shop/:path*", permanent: true },
      { source: "/app/t/:tenant/admin", destination: "/app/t/:tenant/settings", permanent: true },
      // The public network's own address.
      { source: `/app/t/${PUBLIC}`, destination: "/app", permanent: false },
      { source: `/app/t/${PUBLIC}/:path*`, destination: "/app/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
