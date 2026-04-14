"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wand2 } from "lucide-react";

const schema = z.object({
  originalUrl: z.string().url("Vui lòng nhập URL hợp lệ"),
  customSlug: z
    .string()
    .max(64, "Slug không quá 64 ký tự")
    .regex(/^[a-zA-Z0-9-_]*$/, "Slug chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới")
    .optional()
    .default(""),
  utmSource: z.string().max(100).optional().default(""),
  utmMedium: z.string().max(100).optional().default(""),
  utmCampaign: z.string().max(120).optional().default(""),
  tagsInput: z.string().optional().default(""),
  folderName: z.string().max(120).optional().default(""),
  password: z.string().max(64).optional().default(""),
  expiresAt: z.string().optional().default(""),
  clickLimit: z.coerce.number().int().positive().optional(),
});

type FormValues = z.infer<typeof schema>;

function randomSlug(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function CreateLinkForm(): JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metaTitle, setMetaTitle] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      originalUrl: "",
      customSlug: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      tagsInput: "",
      folderName: "",
      password: "",
      expiresAt: "",
    },
  });

  const originalUrl = watch("originalUrl");
  const customSlug = watch("customSlug");

  const previewUrl = useMemo(() => {
    const slug = customSlug || "abcdef";
    return `https://s.thinksmartins.com/${slug}`;
  }, [customSlug]);

  const fetchMetaTitle = async (): Promise<void> => {
    if (!originalUrl) return;

    setErrorText("");

    const res = await fetch("/api/links/meta-title", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: originalUrl }),
    });

    const payload = (await res.json()) as { success: boolean; data?: { title: string | null }; message?: string };
    if (!payload.success) {
      setErrorText(payload.message ?? "Không lấy được meta title.");
      return;
    }

    setMetaTitle(payload.data?.title ?? "(Không có tiêu đề)");
  };

  const onSubmit = async (values: FormValues): Promise<void> => {
    setIsSubmitting(true);
    setErrorText("");

    const tags = values.tagsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        originalUrl: values.originalUrl,
        metaTitle: metaTitle || undefined,
        customSlug: values.customSlug || undefined,
        utmSource: values.utmSource || undefined,
        utmMedium: values.utmMedium || undefined,
        utmCampaign: values.utmCampaign || undefined,
        tags,
        folderName: values.folderName || undefined,
        password: values.password || undefined,
        expiresAt: values.expiresAt || undefined,
        clickLimit: Number.isFinite(values.clickLimit) ? values.clickLimit : undefined,
      }),
    });

    const payload = (await res.json()) as { success: boolean; message?: string };
    if (!payload.success) {
      setErrorText(payload.message ?? "Tạo link thất bại.");
      setIsSubmitting(false);
      return;
    }

    router.push("/links");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <section className="space-y-2">
        <label className="text-sm text-slate-300" htmlFor="originalUrl">
          URL gốc
        </label>
        <input
          id="originalUrl"
          placeholder="https://example.com/trang-dich"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
          {...register("originalUrl")}
        />
        {errors.originalUrl && <p className="text-xs text-rose-300">{errors.originalUrl.message}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchMetaTitle}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            Tự động lấy Meta Title
          </button>
          {metaTitle && <span className="text-xs text-cyan-300">Meta title: {metaTitle}</span>}
        </div>
      </section>

      <section className="space-y-2">
        <label className="text-sm text-slate-300" htmlFor="customSlug">
          Slug tùy chỉnh
        </label>
        <div className="flex gap-2">
          <input
            id="customSlug"
            placeholder="Để trống để tự sinh 6 ký tự"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            {...register("customSlug")}
          />
          <button
            type="button"
            onClick={() => setValue("customSlug", randomSlug())}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
          >
            <Wand2 size={14} /> Tạo nhanh
          </button>
        </div>
        {errors.customSlug && <p className="text-xs text-rose-300">{errors.customSlug.message}</p>}
        <p className="text-xs text-slate-500">Preview: {previewUrl}</p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="utmSource">
            UTM Source
          </label>
          <input
            id="utmSource"
            placeholder="facebook"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            {...register("utmSource")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="utmMedium">
            UTM Medium
          </label>
          <input
            id="utmMedium"
            placeholder="cpc"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            {...register("utmMedium")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="utmCampaign">
            UTM Campaign
          </label>
          <input
            id="utmCampaign"
            placeholder="bao-hiem-thang-4"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            {...register("utmCampaign")}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="tagsInput">
            Tags (phân cách dấu phẩy)
          </label>
          <input
            id="tagsInput"
            placeholder="ads, renewals, zalo"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            {...register("tagsInput")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="folderName">
            Folder
          </label>
          <input
            id="folderName"
            placeholder="Chiến dịch bảo hiểm"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            {...register("folderName")}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="password">
            Mật khẩu bảo vệ link
          </label>
          <input
            id="password"
            type="password"
            placeholder="Tùy chọn"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            {...register("password")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="expiresAt">
            Hết hạn lúc
          </label>
          <input
            id="expiresAt"
            type="datetime-local"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 focus:ring"
            {...register("expiresAt")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="clickLimit">
            Giới hạn click
          </label>
          <input
            id="clickLimit"
            type="number"
            min={1}
            placeholder="Ví dụ: 10000"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            {...register("clickLimit")}
          />
        </div>
      </section>

      {errorText && <p className="rounded-lg border border-rose-900/70 bg-rose-950/60 p-2 text-xs text-rose-200">{errorText}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Đang tạo..." : "Tạo link rút gọn"}
        </button>
      </div>
    </form>
  );
}
