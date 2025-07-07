"use client";
import React from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";

    
    export default function ShopImportForm() {
      return (
        <>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            Personal Information
          </h4>
    
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-1">
              <Label>First Name</Label>
              <Input type="text" placeholder="Emirhan" />
            </div>
    
            <div className="col-span-1">
              <Label>Last Name</Label>
              <Input type="text" placeholder="Boruch" />
            </div>
    
            <div className="col-span-1">
              <Label>Email</Label>
              <Input type="email" placeholder="emirhanboruch55@gmail.com" />
            </div>
    
            <div className="col-span-1">
              <Label>Phone</Label>
              <Input type="text" placeholder="+09 363 398 46" />
            </div>
    
            <div className="col-span-1 sm:col-span-2">
              <Label>Bio</Label>
              <Input type="text" placeholder="Team Manager" />
            </div>
          </div>
        </>
      );
    }


