import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AUIS IT Intern Portal",
    short_name: "AUIS Intern Portal",
    description:
      "Secure semester-based attendance, activity history, and analytics for AUIS IT Department interns.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#08213d",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
