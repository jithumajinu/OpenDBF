import { z, ZodType } from "zod";

export type ContactFormData = {
    avatar: FileList;
    firstName: string;
    lastName: string;
    companyName: string;
    jobTitle: string;
    department: string;
    dateOfBirth: string | null;
    email1: string;
    email2: string;
    phone1: string;
    phone2: string;
    website1: string;
    website2: string;
    addressList: {
        city: string;
        country: string;
        countryCode: string;
        lang: string;
        other: string;
        region: string;
        state: string;
        street: string;
        zip: string;
        stateCode: string;
    }[];
};

export const ContactSchemaDefaultValue = {
    avatar: undefined as any,
    firstName: "",
    lastName: "",
    companyName: "",
    jobTitle: "",
    department: "",
    dateOfBirth: "",
    email1: "",
    email2: "",
    phone1: "",
    phone2: "",
    website1: "",
    website2: "",
    addressList: [
        {
            city: "",
            country: "",
            countryCode: "",
            lang: "",
            other: "",
            region: "",
            state: "",
            street: "",
            zip: "",
            stateCode: ""
        }
    ]
};

export const ContactSchema = z.object({
    avatar: z.any().optional(),
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    companyName: z.string(),
    jobTitle: z.string(),
    department: z.string(),
    dateOfBirth: z.string()
        .nullable()
        .optional()
        .refine((val) => !val || /^\d{2}\/\d{2}\/\d{4}$/.test(val), {
            message: 'Date must be in dd/MM/yyyy format',
        }),
    email1: z.string().email({ message: 'Invalid email' }).min(1, { message: 'Email is required' }),
    email2: z.string().email({ message: 'Invalid email' }).optional().or(z.literal('')),
    phone1: z.string(),
    phone2: z.string(),
    website1: z.string(),
    website2: z.string(),
    addressList: z.array(z.object({
        city: z.string(),
        country: z.string(),
        countryCode: z.string(),
        lang: z.string(),
        other: z.string(),
        region: z.string(),
        state: z.string(),
        street: z.string(),
        zip: z.string(),
        stateCode: z.string()
    }))
});

// export const ContactSchema: ZodType<ContactFormData> = z.object({
//     firstName: z.string()
//         .min(1, { message: 'First name is required' })
//         .max(5, { message: "First name is too long" }),
//     lastName: z.string()
//         .min(1, { message: 'Last name is required' })
//         .max(5, { message: "Last name is too long" }),
// });


// export type UserFormData = z.infer<typeof UserSchema>;

// export type UserFormProps = {
//     register: UseFormRegister<UserFormData>;
//     errors: Record<string, FieldError | undefined>;
//     onSubmit: (data: UserFormData) => void;
//     onError: (errors: any) => void;
//     defaultValues?: UserFormData;
//     className?: string;
//     children?: React.ReactNode;
//     submitButtonText?: string;
// };


// category: z.string().optional(),
// checkbox: z.array(z.string()).default([]),
// radio: z.string().optional(),

// export const formSchema: ZodType<any> = z
//     .object({
//         email: z.string().email(),
//         githubUrl: z
//             .string()
//             .url()
//             .includes("github.com", { message: "Invalid GitHub URL" }),
//         yearsOfExperience: z
//             .number({
//                 required_error: "required field",
//                 invalid_type_error: "Years of Experience is required",
//             })
//             .min(1)
//             .max(10),
//         password: z
//             .string()
//             .min(8, { message: "Password is too short" })
//             .max(20, { message: "Password is too long" }),
//         confirmPassword: z.string(),
//     })
//     .refine((data) => data.password === data.confirmPassword, {
//         message: "Passwords do not match",
//         path: ["confirmPassword"], // path of error
//     });

