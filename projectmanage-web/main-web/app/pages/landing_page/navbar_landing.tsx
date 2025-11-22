"use client";

import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";

export default function Nav() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    }

    return (
        <nav className="bg-[#161815] fixed top-0 left-0 w-full z-50">
            <div className="container mx-auto relative py-2 md:py-4 px-4 text-white text-sm max-w-[1320px] h-auto flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <div className="flex flex-row items-center">
                        <a href="#">
                            <img src="/Logo-main.png" alt="Logo" className="h-10 w-10 md:h-14 md:w-14"/>
                        </a>
                        <a href="#" className="">
                           MyDaily
                        </a>
                        
                    </div>
                    <ul className={`${!isOpen ? 'hidden transition-all transition-discrete opacity-0' : 'flex' } flex flex-col md:flex md:opacity-100 md:mx-10 md:gap-5 md:flex-row`}>
                        <li className="my-2 hover:text-[#6E8CFB]"><a href="#header">Overview</a></li>
                        <li className="my-2 hover:text-[#6E8CFB]"><a  href="#howto">How to Use ?</a></li>
                        <li className="my-2 hover:text-[#6E8CFB]"><a href="#demo">Demo</a></li>
                        <li className="my-2 hover:text-[#6E8CFB]"><a href="#footer">F&Q</a></li>
                    </ul>
                </div>
                <ul className={`${!isOpen ? 'hidden transition-all transition-discrete opacity-0' : 'flex' } flex flex-col my-5 md:my-0 md:flex md:opacity-100 md:flex-row gap-5`}>
                    <li className="my-2"><a className="inline-flex justify-center items-center border-1 border-[#6E8CFB] hover:bg-[#6E8CFB] px-4 py-2 rounded-md" href="/login">Sign in</a></li>
                    <li className="my-2"><a className="inline-flex justify-center items-center bg-[#6E8CFB] hover:bg-[#50589C] px-4 py-2 rounded-md" href="/overview">Get Started</a></li>
                </ul>

                {/*section toggle hidden*/}
                <GiHamburgerMenu onClick={toggleMenu} className="absolute right-5 mt-3 md:mt-5 text-xl md:hidden"/>
     
            </div>
        </nav>
    );
}