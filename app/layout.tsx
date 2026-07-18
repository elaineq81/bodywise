import type {Metadata} from "next";
import {Barlow_Condensed,DM_Sans} from "next/font/google";
import "./globals.css";
const display=Barlow_Condensed({variable:"--display",subsets:["latin"],weight:["500","600","700"]}),body=DM_Sans({variable:"--body",subsets:["latin"],weight:["400","500","600","700"]});
export const metadata:Metadata={
  title:"Bodywise — Calisthenics that fits you",
  description:"An adaptive calisthenics coach with clear positions, guided timing, skill paths, and progress feedback.",
  openGraph:{title:"Bodywise — Move well. Get stronger.",description:"Adaptive calisthenics for your age, readiness, experience, and goals.",images:[{url:"/og.png",width:1536,height:909,alt:"Bodywise adaptive calisthenics coach"}]},
  twitter:{card:"summary_large_image",title:"Bodywise — Move well. Get stronger.",description:"Adaptive calisthenics for your age, readiness, experience, and goals.",images:["/og.png"]}
};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${display.variable} ${body.variable}`}>{children}</body></html>}
