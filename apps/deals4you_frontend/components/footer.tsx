"use client";

import React from "react";
import { DealsLogo } from "./deals-logo";

export default function Footer() {
  return (
    <footer
      className="relative z-20 w-full border-t border-gray-800 bg-[#000000] text-white"
      style={{ backgroundColor: "#000000" }}
    >
      <div className="max-w-7xl mx-auto px-8 py-28">

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-16">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <DealsLogo width={180} height={120} priority className="h-24 w-40 sm:h-28 sm:w-48" />

            <p className="mt-6 text-sm text-gray-400 max-w-xs leading-relaxed">
              Discover curated deals tailored to your preferences. Save smarter,
              every day.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-6">
              Company
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-amber-400 transition">About Us</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Careers</a></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-6">
              Help
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-amber-400 transition">Track Deals</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Support</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">FAQs</a></li>
            </ul>
          </div>

          {/* Contact + Social */}
          <div>
            <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-6">
              Contact
            </h3>
            <p className="text-sm text-gray-400">+1 234 567 890</p>
            <p className="text-sm text-gray-400 mb-8">support@deals4you.com</p>

            {/* Social */}
            <div className="flex gap-4 mb-8">
              {["F", "Y", "X", "I"].map((s, i) => (
                <div
                  key={i}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-400 hover:text-black transition"
                >
                  {s}
                </div>
              ))}
            </div>

            {/* App buttons */}
            <div className="flex gap-4">
              <div className="px-5 py-2.5 bg-gray-800 rounded-md text-xs hover:bg-gray-700 transition">
                App Store
              </div>
              <div className="px-5 py-2.5 bg-gray-800 rounded-md text-xs hover:bg-gray-700 transition">
                Google Play
              </div>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">

          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Deals4You. All rights reserved.
          </p>

          <p className="text-xs text-gray-500">
            Powered by <span className="text-amber-400">Your Company</span>
          </p>

        </div>
      </div>
    </footer>
  );
}