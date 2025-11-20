"use client";

import Navbar from "./navbar_landing";
import Header from "./hero_landing";
import HowToPage from "./howToPage";
import Demo from "./demo_landing";
import Footer from "./footer_landing";

export default function LandingPage() {
    return (
        <div>
            <Navbar></Navbar>
            <Header></Header>
            <HowToPage></HowToPage> 
            <Demo></Demo>
            <Footer></Footer>
        </div> 
    );
}