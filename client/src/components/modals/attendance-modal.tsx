import { useState, useEffect } from "react";
import { apiUrls } from "../../constants/api-urls";
import { useModal } from "../../stores/modal-store";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogTitle } from "../ui/dialog";
import { ModalLayout } from "./modal-layout";
import { Checkbox } from "../ui/checkbox";
import { Loader2Icon } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useApi } from "@/hooks/useApiRequest";

const AttendanceModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const modal = modals.find((modal) => modal.type === "attendance");

  const [attendance, setAttendance] = useState<Record<string, number>>({});
  const [toggleAll, setToggleAll] = useState(false);

  const {
    fetchedData: data,
    isLoading,
    mutateData,
  } = useApi({
    apiUrl: `${apiUrls.classroom.getClassStudents}/${modal?.data?.classroom?._id}?pageLimit=all`,
  });

  useEffect(() => {
    if (data?.students) {
      const initialAttendance: Record<string, number> = {};
      data.students.forEach((student: IStudent) => {
        initialAttendance[student._id] = 0;
      });
      setAttendance(initialAttendance);
    }
  }, [data]);

  const handleCheckboxChange = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 1 ? 0 : 1,
    }));
  };

  const handleToggleAll = () => {
    const newStatus = toggleAll ? 0 : 1;
    const updatedAttendance: Record<string, number> = {};

    data?.students.forEach((student: IStudent) => {
      updatedAttendance[student._id] = newStatus;
    });

    setAttendance(updatedAttendance);
    setToggleAll(!toggleAll);
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();

    doc.text(`Attendance Report - ${currentDate}`, 10, 10);

    const tableData = data?.students.map((student: IStudent) => [
      student.name,
      attendance[student._id] === 1 ? "Present" : "Absent",
    ]);

    autoTable(doc, {
      head: [["Student Name", "Status"]],
      body: tableData || [],
    });

    doc.save(
      `${modal?.data?.classroom?.name}-attendance-report-${currentDate}.pdf`
    );
  };

  const handleSubmitAttendance = async () => {
    await mutateData({
      url: apiUrls.attendance.markAttendance,
      method: "POST",
      payload: {
        classroomId: modal?.data?.classroom?._id,
        subjectId: modal?.data?.subjectId,
        periodId: modal?.data?.periodId,
        date: new Date(),
        students: Object.keys(attendance).map((studentId) => ({
          studentId,
          status: attendance[studentId].toString(),
        })),
      },
      queryKey: ["teacher-schedule"],
    });

    closeModal();
  };

  return (
    <ModalLayout isOpen={!!modal}>
      <DialogTitle className="text-bold text-xl">Mark Attendance</DialogTitle>
      <div>
        {isLoading ? (
          <div className="size-full flex items-center justify-center">
            <Loader2Icon className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-y-4 max-h-[70vh] overflow-auto">
            <div className="flex items-center gap-x-2">
              <Button onClick={handleToggleAll}>
                {toggleAll ? "Absent All" : "Present All"}
              </Button>
            </div>

            {data?.students?.map((student: IStudent) => (
              <div key={student._id} className="flex items-center gap-x-2">
                <Checkbox
                  checked={attendance[student._id] === 1}
                  onClick={() => handleCheckboxChange(student._id)}
                />
                <div className="space-x-4 overflow-hidden grid grid-cols-8 items-center w-full">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap col-span-6">
                    {student.name}
                  </span>

                  <span className="col-span-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    ({student.roll})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          onClick={() =>
            openModal("confirm", { performingAction: handleSubmitAttendance })
          }
          disabled={!Object.keys(attendance).length || isLoading}
          isLoading={isLoading}
        >
          Submit Attendance
        </Button>
        <Button
          variant={"outline"}
          onClick={generatePdf}
          disabled={!Object.keys(attendance).length}
        >
          Download Sheet
        </Button>
      </DialogFooter>
    </ModalLayout>
  );
};

export default AttendanceModal;
