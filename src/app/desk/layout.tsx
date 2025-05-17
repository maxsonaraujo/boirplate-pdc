'use client'
import { DashboardLayout } from "@/components/templates/DashboardLayout";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}