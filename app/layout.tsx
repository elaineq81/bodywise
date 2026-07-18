import type {Metadata} from "next";
import "./globals.css";
import "./real-motion.css";
import "./focus-targets.css";
import "./provider-platform.css";

export const metadata:Metadata={
 metadataBase:new URL("https://bodywise-calisthenics-coach.paramount-ma-0270.chatgpt.site"),
 title:"Bodywise — Your adaptive calisthenics coach",
 description:"Coach-guided, adaptive calisthenics plans with realistic movement demonstrations, recovery guidance, progressions and accessible session controls.",
 openGraph:{title:"Bodywise — Train with purpose",description:"Adaptive calisthenics coaching built around your goals, readiness and schedule.",images:[{url:"/og.png",width:1792,height:896,alt:"Bodywise adaptive calisthenics coach"}]},
 twitter:{card:"summary_large_image",images:["/og.png"]}
};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" style={{"--display":"Impact, 'Arial Narrow', sans-serif","--body":"Arial, sans-serif"} as React.CSSProperties}><body>{children}</body></html>}
