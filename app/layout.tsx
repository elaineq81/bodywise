import type {Metadata} from "next";
import {Barlow_Condensed,DM_Sans} from "next/font/google";
import "./globals.css";
const display=Barlow_Condensed({variable:"--display",subsets:["latin"],weight:["500","600","700"]}),body=DM_Sans({variable:"--body",subsets:["latin"],weight:["400","500","600","700"]});
export const metadata:Metadata={title:"Bodywise — Calisthenics that fits you",description:"A personal, age-aware calisthenics coach with clear positions and guided timing."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${display.variable} ${body.variable}`}>{children}</body></html>}
