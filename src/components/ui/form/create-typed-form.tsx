import UiForm from "@/components/ui/form/ui-form.tsx";
import UiFormItem from "@/components/ui/form/ui-form-item.tsx";
import UiFormList from "@/components/ui/form/ui-form-list.tsx";
import UiFormProvider from "@/components/ui/form/ui-form-provider.tsx";

/**
 * @example
 * const { UiForm, UiFormItem, UiFormList } = createTypedForm<MyFormValues>();
 */
export const createTypedForm = <T,>() => {
	return {UiForm: UiForm<T>, UiFormItem: UiFormItem<T>, UiFormList: UiFormList, UiFormProvider: UiFormProvider};
};
