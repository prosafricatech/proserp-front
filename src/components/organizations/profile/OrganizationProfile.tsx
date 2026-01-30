import JumboCardQuick from "@jumbo/components/JumboCardQuick";
import JumboContentLayout from "@jumbo/components/JumboContentLayout";
import React from "react";
import { Header } from "./header/Header";
import OrganizationProfileProvider from "./OrganizationProfileProvider";
import { ProfileTabs } from "./ProfileTabs";


export default function OrganizationProfile(){

    return (
        <OrganizationProfileProvider>
            <JumboContentLayout header={<Header/>} >
                <JumboCardQuick
                    noWrapper
                    sx={{ 
                        height:'100%'
                     }}
                >
                    <ProfileTabs />
                </JumboCardQuick>
            </JumboContentLayout>
        </OrganizationProfileProvider>
    )
}