import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useParams } from "react-router";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  FieldLabel,
  SectionLabel,
  SelectInput,
  TextInput,
  type StepHandle,
} from "./_shared";
import TiptapEditor from "@components/form/TiptapEditor";
import { CaseFormData, CaseObjectSchema, MATTER_TYPES, NewCaseSchemaDefaultValue } from "../CaseTypes";
import DatePicker from "@components/form/date-picker.tsx";
import { useModal } from "@appAssets/hooks/useModal";
import { Modal } from "@components/ui/modal";
import { useAppDispatch } from "@appAssets/hooks/useAppDispatch";
import { useAppSelector } from "@appAssets/hooks/useAppDispatch";
import { searchContactsAsync, type Contact } from "@appAssets/store/contactSlice";
import { ApiService } from "@apiServices/ApiService";
import { notifyMessage } from "@appAssets/utils/JToast.tsx";
import { setSelectedMatterType, setStep1Success } from "@appAssets/store/caseSlice";


export default forwardRef<StepHandle>(function Step1ClientIntake(_, ref) {
  const { matterKey } = useParams<{ matterKey: string }>();
  const [isFormEditable, setIsFormEditable] = useState(!matterKey);
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty },
    control,
  } = useForm<CaseFormData>({
    defaultValues: NewCaseSchemaDefaultValue,
    resolver: zodResolver(CaseObjectSchema),
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control,
    name: "clientContact.addressList",
  });

  const dispatch = useAppDispatch();
  const { onChange: onMatterTypeChange, ...matterTypeRegistration } = register("matterType", { valueAsNumber: true });
  const searchResults = useAppSelector((s) => s.contact.searchResults);
  const searchLoading = useAppSelector((s) => s.contact.searchLoading);
  const savedStep1Data = useAppSelector((s) => s.case.step1Data);
  const matterId = useAppSelector((s) => s.case.matterId);

  // Restore last entered data when navigating back — also re-runs once the async
  // edit-mode fetch (loadMatterForEditAsync) populates step1Data after this mounts
  useEffect(() => {
    if (savedStep1Data) {
      reset(savedStep1Data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedStep1Data]);

  const pullContactModal = useModal();
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFormChanges = (data: CaseFormData) => {
    const baseline = savedStep1Data ?? NewCaseSchemaDefaultValue;
    return JSON.stringify(data) !== JSON.stringify(baseline);
  };

  // Dispatch search on every keystroke with 300 ms debounce — only while modal is open
  useEffect(() => {
    if (!pullContactModal.isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(searchContactsAsync(contactSearch.trim()));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [contactSearch, pullContactModal.isOpen, dispatch]);

  // Load initial list when modal opens
  useEffect(() => {
    if (pullContactModal.isOpen) {
      dispatch(searchContactsAsync(""));
    }
  }, [pullContactModal.isOpen, dispatch]);

  const handleSelectContact = (contact: Contact) => {
    setValue("clientContact.id", contact.id ?? null, { shouldDirty: true });
    setValue("clientContact.firstName", contact.firstName ?? "", { shouldDirty: true, shouldValidate: true });
    setValue("clientContact.lastName", contact.lastName ?? "", { shouldDirty: true, shouldValidate: true });
    setValue("clientContact.companyName", contact.companyName ?? "", { shouldDirty: true });
    setValue("clientContact.jobTitle", contact.jobTitle ?? "", { shouldDirty: true });
    setValue("clientContact.department", contact.department ?? "", { shouldDirty: true });
    setValue("clientContact.email1", contact.email1 ?? "", { shouldDirty: true, shouldValidate: true });
    setValue("clientContact.email2", contact.email2 ?? "", { shouldDirty: true });
    setValue("clientContact.phone1", contact.phone1 ?? "", { shouldDirty: true, shouldValidate: true });
    setValue("clientContact.phone2", contact.phone2 ?? "", { shouldDirty: true });
    setValue("clientContact.website1", contact.website1 ?? "", { shouldDirty: true });
    setValue("clientContact.website2", contact.website2 ?? "", { shouldDirty: true });
    setValue("clientContact.dateOfBirth", contact.dateOfBirth ?? null, { shouldDirty: true });
    if (contact.addressList?.length) {
      const mapped = contact.addressList.map(({ addressId: _id, ...rest }) => rest);
      setValue("clientContact.addressList", mapped, { shouldDirty: true });
    }
    setSelectedContact(contact);
    pullContactModal.closeModal();
    setContactSearch("");
  };

  const [activeMainTab, setActiveMainTab] = useState<"matter" | "client">("matter");
  const [activeClientTab, setActiveClientTab] = useState<"basic" | "contact" | "address">("basic");
  const [clearKey, setClearKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  // Contact pulled from an existing record — its fields are read-only here
  const isContactLocked = Boolean(watch("clientContact.id"));

  const handleSave = () =>
    new Promise<boolean>((resolve) => {
      const currentValues = getValues();
      if (!isDirty && !hasFormChanges(currentValues)) {
        resolve(Boolean(matterId));
        return;
      }

      handleSubmit(
        async (data: CaseFormData) => {
          try {
            setIsSaving(true);
            const response = matterId
              ? await ApiService.getInstance().caseService.updateMatterStep1(matterId, data)
              : await ApiService.getInstance().caseService.createMatterStep1(data);

            if (response.hasData) {
              dispatch(setStep1Success({ formData: data, response: response.data.data }));
              reset(data);
              notifyMessage("The client intake has been successfully saved", "SUCCESS");
              resolve(true);
            } else {
              notifyMessage("Failed to save the client intake", "ERROR");
              resolve(false);
            }
          } catch (err) {
            notifyMessage("Failed to save the client intake", "ERROR");
            console.error("client-intake API failed:", err);
            resolve(false);
          } finally {
            setIsSaving(false);
          }
        },
        () => resolve(false),
      )();
    });

  // Expose submit() / clear() so NewCaseManager can drive this step
  useImperativeHandle(ref, () => ({
    submit: handleSave,
    clear: () => {
      reset(NewCaseSchemaDefaultValue);
      setSelectedContact(null);
      setClearKey((k) => k + 1);
    },
  }));

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {/* ── Main tabs: Matter Details / Client Details of Matter — always clickable */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/60">
          <button
            type="button"
            onClick={() => setActiveMainTab("matter")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeMainTab === "matter"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-briefcase text-sm" />
            Matter details
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("client")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeMainTab === "client"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-user text-sm" />
            Client details
          </button>
        </div>

        {matterKey && (
          <button
            type="button"
            onClick={() => setIsFormEditable(true)}
            disabled={isFormEditable}
            className="flex items-center gap-1.5 rounded-lg border border-brand-400 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-default disabled:opacity-50 dark:border-brand-500/50 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
          >
            <i className="ti ti-pencil text-sm" />
            Edit
          </button>
        )}

        {isFormEditable && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-default disabled:opacity-50"
          >
            <i className="ti ti-device-floppy text-sm" />
            {isSaving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      {/* ── Sub-tabs: Basic Info / Contact / Address — always clickable */}
      {activeMainTab === "client" && (
        <div className="mb-4 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/60">
          <button
            type="button"
            onClick={() => setActiveClientTab("basic")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeClientTab === "basic"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-id text-sm" />
            Basic info
          </button>
          <button
            type="button"
            onClick={() => setActiveClientTab("contact")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeClientTab === "contact"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-phone text-sm" />
            Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveClientTab("address")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeClientTab === "address"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-map-pin text-sm" />
            Address
            {addressFields.length > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                {addressFields.length}
              </span>
            )}
          </button>
        </div>
      )}

      <fieldset disabled={!isFormEditable} className="disabled:opacity-70">

        {/* ── Tab 1: Matter Details ─────────────────────────────────────── */}
        {activeMainTab === "matter" && (
          <>
            {/* ── Case info ───────────────────────────────────────────────── */}
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel>Matter Title</FieldLabel>
                <TextInput placeholder="Enter matter title" {...register("matterName")} />
                {errors.matterName && (
                  <p className="mt-1 text-xs text-error-500">{errors.matterName.message}</p>
                )}
              </div>
              <div>
                <FieldLabel>Client type</FieldLabel>
                <SelectInput options={["Individual", "Company", "Trust"]} {...register("clientType")} />
                {errors.clientType && (
                  <p className="mt-1 text-xs text-error-500">{errors.clientType.message}</p>
                )}
              </div>
              <div>
                <FieldLabel>Matter type</FieldLabel>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  {...matterTypeRegistration}
                  onChange={(event) => {
                    onMatterTypeChange(event);
                    dispatch(setSelectedMatterType(Number(event.target.value)));
                  }}
                >
                  {MATTER_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.matterType && (
                  <p className="mt-1 text-xs text-error-500">Select a matter type</p>
                )}
              </div>
              <div>
                <FieldLabel>Referred by</FieldLabel>
                <TextInput placeholder="Self / walk-in" {...register("referredBy")} />
              </div>
            </div>

            {/* ── Initial matter ──────────────────────────────────────────── */}
            <div className="mb-3">
              <FieldLabel>Initial matter / brief</FieldLabel>
              <div className={isFormEditable ? undefined : "pointer-events-none"}>
                <TiptapEditor
                  value={watch("initialMatter")}
                  placeholder="Describe the legal matter…"
                  onChange={(html) => setValue("initialMatter", html, { shouldDirty: true })}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Tab 2: Client Details of Matter ─────────────────────────────── */}
        {activeMainTab === "client" && (
          <>
            {/* Pull Contact */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <button
                  type="button"
                  onClick={pullContactModal.openModal}
                  className="flex w-full items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm text-purple-600 outline-none transition hover:border-purple-400 hover:bg-purple-100 hover:text-purple-700 dark:border-purple-700 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:border-purple-500 dark:hover:bg-purple-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  {selectedContact
                    ? `${selectedContact.firstName} ${selectedContact.lastName}`
                    : "Search existing contacts…"}
                </button>
              </div>

              {isContactLocked && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
                  <i className="ti ti-lock text-sm" />
                  This contact was pulled from an existing record, so its details are read-only here.
                </div>
              )}
            </div>
            <Modal
              isOpen={pullContactModal.isOpen}
              onClose={pullContactModal.closeModal}
              overlayClassName="bg-black/40 backdrop-blur-sm"
              className="relative m-4 w-full max-w-lg p-0 sm:m-0"
            >
              <div className="flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                  <div>
                    <h4 className="text-base font-semibold text-gray-800 dark:text-white">Search Contact</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Select a contact to auto-fill client details</p>
                  </div>
                  <button
                    type="button"
                    onClick={pullContactModal.closeModal}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Search input */}
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type a name to search…"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Contact list */}
                <ul className="overflow-y-auto flex-1 px-2 py-2">
                  {searchLoading ? (
                    /* Loading skeleton */
                    Array.from({ length: 4 }).map((_, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 animate-pulse">
                        <span className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-1.5">
                          <span className="block h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                          <span className="block h-2.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                      </li>
                    ))
                  ) : searchResults.length === 0 ? (
                    <li className="px-3 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                      No contacts found
                    </li>
                  ) : (
                    searchResults.map((contact) => {
                      const initials = `${contact.firstName[0] ?? ""}${contact.lastName[0] ?? ""}`.toUpperCase();
                      return (
                        <li key={contact.id ?? contact.firstName}>
                          <button
                            type="button"
                            onClick={() => handleSelectContact(contact)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-brand-50 dark:hover:bg-brand-500/10"
                          >
                            {contact.avatar ? (
                              <img src={contact.avatar} alt={initials} className="h-9 w-9 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                {initials}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                                {contact.firstName} {contact.lastName}
                              </p>
                              {contact.status && (
                                <p className="truncate text-xs capitalize text-gray-400 dark:text-gray-500">
                                  {contact.status}
                                </p>
                              )}
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </Modal>



            {/* Tab content */}
            <fieldset disabled={isContactLocked} className="mb-4 border border-gray-200 rounded-xl px-4 py-4 disabled:opacity-70 dark:border-gray-800">

              {/* ── Basic Info tab ───────────────────────────────────────── */}
              {activeClientTab === "basic" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>First Name</FieldLabel>
                    <TextInput placeholder="First name" {...register("clientContact.firstName")} />
                    {errors.clientContact?.firstName && (
                      <p className="mt-1 text-xs text-error-500">{errors.clientContact.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel>Last Name</FieldLabel>
                    <TextInput placeholder="Last name" {...register("clientContact.lastName")} />
                    {errors.clientContact?.lastName && (
                      <p className="mt-1 text-xs text-error-500">{errors.clientContact.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel>Birth Day</FieldLabel>
                    <Controller
                      control={control}
                      name="clientContact.dateOfBirth"
                      render={({ field }) => {
                        const defaultDate = (() => {
                          if (!field.value) return undefined;
                          const parts = field.value.split("/");
                          if (parts.length === 3) {
                            const [dd, mm, yyyy] = parts;
                            return new Date(`${yyyy}-${mm}-${dd}`);
                          }
                          return undefined;
                        })();
                        return (
                          <DatePicker
                            key={clearKey}
                            id="case-date-of-birth-picker"
                            placeholder="dd/MM/yyyy"
                            defaultDate={defaultDate}
                            onChange={(dates) => {
                              if (dates[0]) {
                                const d = dates[0];
                                const dd = String(d.getDate()).padStart(2, "0");
                                const mm = String(d.getMonth() + 1).padStart(2, "0");
                                const yyyy = d.getFullYear();
                                field.onChange(`${dd}/${mm}/${yyyy}`);
                              } else {
                                field.onChange(null);
                              }
                            }}
                            onClear={() => { field.onChange(null); setClearKey((k) => k + 1); }}
                          />
                        );
                      }}
                    />
                    {errors.clientContact?.dateOfBirth && (
                      <p className="mt-1 text-xs text-error-500">{errors.clientContact.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel>PAN / ID No.</FieldLabel>
                    <TextInput placeholder="ABCPK1234R" {...register("clientContact.panId")} />
                  </div>
                  <div>
                    <FieldLabel>Company / Entity Name</FieldLabel>
                    <TextInput placeholder="Company name" {...register("clientContact.companyName")} />
                  </div>
                  <div>
                    <FieldLabel>Job Title</FieldLabel>
                    <TextInput placeholder="Job title" {...register("clientContact.jobTitle")} />
                  </div>
                  <div>
                    <FieldLabel>Department</FieldLabel>
                    <TextInput placeholder="Department" {...register("clientContact.department")} />
                  </div>
                </div>
              )}

              {/* ── Contact tab ──────────────────────────────────────────── */}
              {activeClientTab === "contact" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Email 1</FieldLabel>
                    <TextInput type="email" placeholder="Primary email" {...register("clientContact.email1")} />
                    {errors.clientContact?.email1 && (
                      <p className="mt-1 text-xs text-error-500">{errors.clientContact.email1.message}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel>Email 2</FieldLabel>
                    <TextInput type="email" placeholder="Secondary email" {...register("clientContact.email2")} />
                    {errors.clientContact?.email2 && (
                      <p className="mt-1 text-xs text-error-500">{errors.clientContact.email2.message}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel>Phone 1</FieldLabel>
                    <TextInput type="tel" placeholder="+91 XXXXX XXXXX" {...register("clientContact.phone1")} />
                    {errors.clientContact?.phone1 && (
                      <p className="mt-1 text-xs text-error-500">{errors.clientContact.phone1.message}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel>Phone 2</FieldLabel>
                    <TextInput type="tel" placeholder="+91 XXXXX XXXXX" {...register("clientContact.phone2")} />
                  </div>
                  <div>
                    <FieldLabel>Website 1</FieldLabel>
                    <TextInput type="url" placeholder="https://example.com" {...register("clientContact.website1")} />
                  </div>
                  <div>
                    <FieldLabel>Website 2</FieldLabel>
                    <TextInput type="url" placeholder="https://example.com" {...register("clientContact.website2")} />
                  </div>
                </div>
              )}

              {/* ── Address tab ──────────────────────────────────────────── */}
              {activeClientTab === "address" && (
                <div>
                  {addressFields.map((field, index) => (
                    <div key={field.id} className={index > 0 ? "mt-5 border-t border-gray-100 pt-4 dark:border-gray-800" : ""}>
                      <div className="mb-2 flex items-center justify-between">
                        {addressFields.length > 1 && (
                          <p className="border-l-2 border-brand-400 pl-2 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:border-brand-500 dark:text-gray-200">
                            Address {index + 1}
                          </p>
                        )}
                        {addressFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddress(index)}
                            className="text-xs text-error-500 hover:text-error-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <FieldLabel>Street</FieldLabel>
                          <TextInput placeholder="Street address" {...register(`clientContact.addressList.${index}.street`)} />
                        </div>
                        <div>
                          <FieldLabel>City</FieldLabel>
                          <TextInput placeholder="City" {...register(`clientContact.addressList.${index}.city`)} />
                        </div>
                        <div>
                          <FieldLabel>State</FieldLabel>
                          <TextInput placeholder="State" {...register(`clientContact.addressList.${index}.state`)} />
                        </div>
                        <div>
                          <FieldLabel>State Code</FieldLabel>
                          <TextInput placeholder="State code" {...register(`clientContact.addressList.${index}.stateCode`)} />
                        </div>
                        <div>
                          <FieldLabel>ZIP</FieldLabel>
                          <TextInput placeholder="ZIP / Pincode" {...register(`clientContact.addressList.${index}.zip`)} />
                        </div>
                        <div>
                          <FieldLabel>Country</FieldLabel>
                          <TextInput placeholder="Country" {...register(`clientContact.addressList.${index}.country`)} />
                        </div>
                        <div>
                          <FieldLabel>Country Code</FieldLabel>
                          <TextInput placeholder="Country code" {...register(`clientContact.addressList.${index}.countryCode`)} />
                        </div>
                        <div>
                          <FieldLabel>Region</FieldLabel>
                          <TextInput placeholder="Region" {...register(`clientContact.addressList.${index}.region`)} />
                        </div>
                        <div>
                          <FieldLabel>Language</FieldLabel>
                          <TextInput placeholder="Language" {...register(`clientContact.addressList.${index}.lang`)} />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Other</FieldLabel>
                          <TextInput placeholder="Other details" {...register(`clientContact.addressList.${index}.other`)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {addressFields.length < 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        appendAddress({
                          street: "", city: "", state: "", stateCode: "",
                          zip: "", country: "", countryCode: "", region: "", lang: "", other: "",
                        })
                      }
                      className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200"
                    >
                      + Add Address
                    </button>
                  )}
                </div>
              )}

            </fieldset>

            {/* ── Conflict check ──────────────────────────────────────────── */}
            <SectionLabel>Conflict check</SectionLabel>
            <Card className="border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10">
              <span className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
                <i className="ti ti-check text-base" />
                No conflict found. This client and opposing party are not linked to any existing open case.
              </span>
            </Card>
          </>
        )}
      </fieldset>
    </form>
  );
});
