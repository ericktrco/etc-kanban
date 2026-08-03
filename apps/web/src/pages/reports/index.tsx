import type { NextPageWithLayout } from "../_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import ReportView from "~/views/reports";

const ReportsPage: NextPageWithLayout = () => {
  return (
    <>
      <ReportView />
      <Popup />
    </>
  );
};

ReportsPage.getLayout = (page) => getDashboardLayout(page);

export default ReportsPage;
