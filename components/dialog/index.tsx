"use client";

import { cn, trytm } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { ReactNode, useCallback, useEffect, useTransition } from "react";
import { DefaultValues, UseFormReturn, useForm } from "react-hook-form";
import { match } from "ts-pattern";
import { z } from "zod";
import { create } from "zustand";
import { Alert } from "../ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Form } from "../ui/form";

interface DialogBaseProps {
  contentClassname?: string;
  description?: ReactNode;
  footer?: ReactNode;
  hideFooter?: boolean;
}

interface DialogConfirmProps extends DialogBaseProps {
  cancelText?: string;
  actionText?: string;
}

interface DialogInfoProps<Result = unknown> extends DialogBaseProps {
  closeText?: string;
  info: ReactNode | ((props: { onClose: () => void; onAction: (value?: Result) => void }) => ReactNode);
}

interface DialogActionProps<T = unknown> {
  label: string;
  value: T;
}

interface DialogActionsProps<Actions extends Readonly<DialogActionProps[]> = Readonly<DialogActionProps[]>>
  extends DialogBaseProps {
  actions: Actions;
}

interface DialogFormProps<Schema extends z.ZodObject = z.ZodObject, Result = unknown> extends DialogBaseProps {
  schema: Schema;
  defaultValues?: DefaultValues<z.TypeOf<Schema>>;
  submitText?: string;
  cancelText?: string;
  submitButton?: (props: { onSubmit: () => void; isLoading: boolean }) => ReactNode;
  cancelButton?: (props: { onCancel: () => void }) => ReactNode;
  wrapper?: (props: { children: ReactNode }) => ReactNode;
  form(form: UseFormReturn<z.infer<Schema>>): ReactNode;
  handler?(ctx: { form: UseFormReturn<z.infer<Schema>>; data: z.TypeOf<Schema>; utils: ContextUtils }): Promise<Result>;
}

type DialogProps =
  | { type: "confirm"; props: DialogConfirmProps }
  | { type: "actions"; props: DialogActionsProps }
  | { type: "info"; props: DialogInfoProps }
  | { type: "form"; props: DialogFormProps };

type BasicFunction<Params extends unknown[] = unknown[], Return = unknown> = (...args: Params) => Return;

interface DialogStore {
  promise: BasicFunction | null;
  title: string | null;
  props: DialogProps;
  clear(): void;
}

const dialogStore = create<DialogStore>((set, get) => ({
  promise: null,
  title: null,
  props: {} as DialogProps,

  clear() {
    set({
      promise: null,
      title: null,
      props: {} as DialogProps,
    });
  },
}));

export const dialog = {
  confirm(title: string, props?: DialogConfirmProps) {
    return new Promise<boolean>((resolve) => {
      dialogStore.setState({
        title,
        promise: resolve as BasicFunction,
        props: {
          type: "confirm",
          props: { ...props },
        },
      });
    });
  },

  actions<Actions extends Readonly<DialogActionProps[]>>(title: string, props: DialogActionsProps<Actions>) {
    return new Promise<Actions[number]["value"] | false>((resolve) => {
      dialogStore.setState({
        title,
        promise: resolve,
        props: { type: "actions", props },
      });
    });
  },

  form<Schema extends z.ZodObject>(title: string, props: DialogFormProps<Schema>) {
    type Response = typeof props extends {
      handler: (...args: unknown[]) => infer HandlerPromise;
    }
      ? Awaited<HandlerPromise>
      : z.TypeOf<Schema>;

    return new Promise<Response | false>((resolve) => {
      dialogStore.setState({
        title,
        promise: resolve as BasicFunction,
        props: {
          type: "form",
          props: props as unknown as DialogFormProps,
        },
      });
    });
  },

  info<Result = unknown>(title: string, props: DialogInfoProps<Result>) {
    return new Promise<Result | false>((resolve) => {
      dialogStore.setState({
        title,
        promise: resolve as BasicFunction,
        props: { type: "info", props },
      });
    });
  },
};

function createContextUtils({ form }: { form: UseFormReturn }) {
  return {
    form,
  };
}

type ContextUtils = ReturnType<typeof createContextUtils>;

export function Dialoger() {
  const { promise, title, props, clear } = dialogStore();

  const handleAction = useCallback(
    (value?: unknown) => {
      clear();
      promise?.(value || true);
    },
    [promise, clear],
  );

  const handleCancel = useCallback(() => {
    clear();
    promise?.(false);
  }, [promise, clear]);

  const open = !!promise && !!title && !!props;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCancel();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className={cn(props.props?.contentClassname)}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {props.props && <AlertDialogDescription>{props.props.description}</AlertDialogDescription>}
        </AlertDialogHeader>

        {props.type &&
          match(props)
            .with({ type: "confirm" }, ({ props }) => (
              <AlertDialogFooter>
                {props.footer}
                <AlertDialogCancel onClick={() => handleCancel()}>{props.cancelText || "Cancelar"}</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleAction()}>{props.actionText || "Continuar"}</AlertDialogAction>
              </AlertDialogFooter>
            ))
            .with({ type: "info" }, ({ props }) => (
              <>
                {typeof props.info === "function"
                  ? props.info({
                      onClose: handleCancel,
                      onAction: handleAction,
                    })
                  : props.info}

                {!props.hideFooter && (
                  <AlertDialogFooter>
                    {props.footer}
                    <AlertDialogAction onClick={() => handleAction()}>{props.closeText || "Fechar"}</AlertDialogAction>
                  </AlertDialogFooter>
                )}
              </>
            ))
            .with({ type: "actions" }, ({ props }) => (
              <AlertDialogFooter>
                {props.footer}

                {props.actions.map((action, index) => (
                  <AlertDialogAction key={index} onClick={() => handleAction(action.value)}>
                    {action.label}
                  </AlertDialogAction>
                ))}
              </AlertDialogFooter>
            ))
            .with({ type: "form" }, ({ props }) => {
              function WithForm() {
                const [isLoading, startTransition] = useTransition();

                const form = useForm({
                  resolver: zodResolver(props.schema),
                  defaultValues: props.defaultValues,
                });

                const handleSubmit = form.handleSubmit(
                  async (data) => {
                    startTransition(async () => {
                      if (props.handler) {
                        const [result, error] = await trytm(
                          props.handler({
                            form,
                            data,
                            utils: createContextUtils({ form }),
                          }),
                        );

                        if (error) {
                          form.setError("root", { message: error.message });
                          return;
                        }

                        return handleAction(result);
                      }

                      handleAction(data);
                    });
                  },
                  (errors) => {
                    console.log(errors);
                    const error = errors.root?.message;

                    if (error) {
                      form.setError("root", { message: error });
                      return;
                    }

                    form.setError("root", {
                      message: "Erro ao enviar o formulário",
                    });
                  },
                );

                const Wrapper = props.wrapper || (({ children }) => <>{children}</>);

                return (
                  <Wrapper>
                    <Form {...form}>
                      <form onSubmit={handleSubmit}>
                        {form.formState.errors?.root && <Alert>{form.formState.errors?.root.message}</Alert>}

                        <div className="flex flex-col space-y-2 mb-3">{props.form(form)}</div>

                        {!props.hideFooter && (
                          <AlertDialogFooter>
                            {props.footer}

                            {props.cancelButton ? (
                              props.cancelButton({ onCancel: handleCancel })
                            ) : (
                              <AlertDialogCancel type="button" onClick={() => handleCancel()}>
                                {props.cancelText ?? `Cancelar`}
                              </AlertDialogCancel>
                            )}

                            {props.submitButton ? (
                              props.submitButton({
                                onSubmit: handleSubmit,
                                isLoading,
                              })
                            ) : (
                              <AlertDialogAction type="submit" disabled={isLoading}>
                                {props.submitText ?? `Enviar`}
                                {isLoading && <Loader2 className="size-4 ml-2 animate-spin" />}
                              </AlertDialogAction>
                            )}
                          </AlertDialogFooter>
                        )}
                      </form>
                    </Form>
                  </Wrapper>
                );
              }

              return <WithForm />;
            })
            .exhaustive()}
      </AlertDialogContent>
    </AlertDialog>
  );
}
