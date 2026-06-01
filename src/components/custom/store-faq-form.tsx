"use client";

import { useFormik } from "formik";
import { useEffect } from "react";
import z from "zod";
import { IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
    CreateStoreFaq,
    UpdateStoreFaq,
    type StoreFaq,
} from "@/redux/api-slice/knowledge-slice";

const validationSchema = z.object({
    question: z.string().trim().min(1, "Question is required"),
    answer: z.string().trim().min(1, "Answer is required"),
});

type StoreFaqFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeCode: string;
    faq?: StoreFaq | null;
    onSaved: () => void;
};

export default function StoreFaqForm({
    open,
    onOpenChange,
    storeCode,
    faq,
    onSaved,
}: StoreFaqFormProps) {
    const dispatch = useAppDispatch();
    const isEditing = Boolean(faq?.id);

    const { CreateStoreFaqIsLoading } = useAppSelector(
        (state) => state.GetKnowledgeReducer.CreateStoreFaqState
    );
    const { UpdateStoreFaqIsLoading } = useAppSelector(
        (state) => state.GetKnowledgeReducer.UpdateStoreFaqState
    );
    const isSaving = CreateStoreFaqIsLoading || UpdateStoreFaqIsLoading;

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            question: faq?.question ?? "",
            answer: faq?.answer ?? "",
        },
        validate: (values) => {
            const result = validationSchema.safeParse(values);
            if (result.success) return {};
            return Object.fromEntries(
                result.error.issues.map((issue) => [issue.path.join("."), issue.message])
            );
        },
        onSubmit: async (values) => {
            const result = isEditing
                ? await dispatch(
                      UpdateStoreFaq({
                          store_code: storeCode,
                          id: faq!.id,
                          question: values.question,
                          answer: values.answer,
                      })
                  )
                : await dispatch(
                      CreateStoreFaq({
                          store_code: storeCode,
                          question: values.question,
                          answer: values.answer,
                      })
                  );

            const succeeded = isEditing
                ? UpdateStoreFaq.fulfilled.match(result)
                : CreateStoreFaq.fulfilled.match(result);

            if (succeeded) {
                onSaved();
                onOpenChange(false);
            }
        },
    });

    useEffect(() => {
        if (open) formik.resetForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, faq?.id]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="gap-0 sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>{isEditing ? "Edit Quick Q&A" : "Add Quick Q&A"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Update the question and answer your chatbot uses to respond."
                            : "Add a quick question and answer to help your chatbot respond faster."}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={formik.handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <FieldGroup className="flex-1 overflow-y-auto px-4">
                        <Field>
                            <FieldLabel htmlFor="question">Question</FieldLabel>
                            <Input
                                id="question"
                                name="question"
                                placeholder="What is your return policy?"
                                autoComplete="off"
                                aria-invalid={Boolean(formik.touched.question && formik.errors.question)}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.question}
                            />
                            {formik.touched.question && formik.errors.question && (
                                <p className="text-xs text-destructive">{formik.errors.question}</p>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="answer">Answer</FieldLabel>
                            <textarea
                                id="answer"
                                name="answer"
                                rows={8}
                                placeholder="Our return policy is 30 days with a receipt."
                                aria-invalid={Boolean(formik.touched.answer && formik.errors.answer)}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.answer}
                                className={cn(
                                    "w-full resize-y rounded-none border border-input bg-transparent px-2.5 py-1.5 text-xs outline-none transition-colors",
                                    "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
                                    "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:bg-input/30"
                                )}
                            />
                            {formik.touched.answer && formik.errors.answer && (
                                <p className="text-xs text-destructive">{formik.errors.answer}</p>
                            )}
                        </Field>
                    </FieldGroup>

                    <SheetFooter>
                        <Button type="submit" disabled={isSaving || !formik.dirty}>
                            {isSaving ? (
                                <>
                                    <IconLoader2 className="animate-spin" />
                                    {isEditing ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    <IconDeviceFloppy />
                                    {isEditing ? "Update" : "Save"}
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSaving}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
