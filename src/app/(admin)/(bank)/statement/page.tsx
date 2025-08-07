import React from "react";
import {StatementBank} from "@/components/StatementBank/StatementBank";


export default function Ecommerce() {
    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12">
                <StatementBank/>
            </div>
        </div>
    );
}