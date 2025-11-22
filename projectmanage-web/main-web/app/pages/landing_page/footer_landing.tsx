'use client';

import { FaFacebook, FaFacebookMessenger, FaGithub } from "react-icons/fa";

export default function Page() {
    return (
        <section id='footer' className='bg-[#161815] h-auto'>
            <div className="container mx-auto relative px-25 py-10 max-w-[1320px] text-white flex flex-col space-y-10 text-sm md:text-md">     
                <div className="justify-items-center py-5">
                    <h1 className="text-2xl md:text-5xl font-bold">-- What's next --</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-15 px-5">
                    <div>
                        <ul className="space-y-3">
                            <li><h1 className="text-lg font-bold">Resources</h1></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Guides</a></li>
                            <li><a href="#">Help Center</a> </li>
                            <li><a href="#">API Documentation</a></li>
                        </ul>
                    </div>
                    <div><ul className="space-y-3">
                            <li><h1 className="text-lg font-bold">Features</h1></li>
                            <li><a href="#">Task Management</a></li>
                            <li><a href="#">Team Collaboration</a></li>
                            <li><a href="#">Real-time Chat</a></li>
                            <li><a href="#">File Sharing</a></li>

                        </ul>
                    </div>
                    <div><ul className="space-y-3">
                            <li><h1 className="text-lg font-bold">Legal</h1></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Cookie Policy</a></li>
                        </ul>
                    </div>
                    <div><ul className="space-y-3">
                            <li><h1 className="text-lg font-bold">Support</h1></li>
                            <li>Project_Management.com</li>
                            <li className="flex flex-row space-x-5 justify-start items-center">
                                <a href="#"><FaFacebook className="h-7 w-7"/></a>
                                <a href="#"><FaFacebookMessenger className="h-7 w-7"/></a>
                                <a href="#"><FaGithub className="h-7 w-7"/></a>   
                            </li>
                        </ul>
                    </div>
                </div>
                <hr></hr>
                <div>
                    <p className="text-center text-[#909090]">© 2025 Project Management. All rights reserved.</p>
                </div>
            </div>
        </section>
    );
}