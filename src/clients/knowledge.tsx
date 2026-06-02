"use client"

import StoreFaqTabContent from "@/components/custom/store-faq-tab-content"
import StorePolicyTabContent from "@/components/custom/store-policy-tab-content"
import StoreDocumentTabContent from "@/components/custom/store-document-tab-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Knowledge() {
    return (
        <div className="p-4">
            <Tabs defaultValue="storefaqs">
                <TabsList>
                    <TabsTrigger value="storefaqs">Quick FAQs</TabsTrigger>
                    <TabsTrigger value="policies">Policies</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="storefaqs">
                    <StoreFaqTabContent />
                </TabsContent>
                <TabsContent value="policies">
                    <StorePolicyTabContent />
                </TabsContent>
                <TabsContent value="documents">
                    <StoreDocumentTabContent />
                </TabsContent>
            </Tabs>
        </div>
    )
}