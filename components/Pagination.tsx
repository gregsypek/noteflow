"use client";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { formUrlQuery } from "@/lib/url";
import next from "next";

interface Props {
  page: number | undefined | string;
  isNext: boolean;
  containerClasses?: string;
}

const Pagination = ({ page = 1, isNext, containerClasses }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleNavigation = (type: "next" | "prev") => {
    const nextPageNumber =
      type === "next" ? Number(page) + 1 : Number(page) - 1;

    //  How formUrlQuery works
    //  formUrlQuery({
    //    params: "page=2&pageSize=10",
    //    key: "page",
    //    value: "3"
    //  }) => "page=3&pageSize=10"
    // params is a string of query params and converts it to URLSearchParams object which makes it easy to manipulate query params

    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "page",
      value: nextPageNumber.toString(),
    });

    router.push(newUrl);
  };
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-2 mt-5",
        containerClasses
      )}
    >
      {/* Previous Page Button */}
      {Number(page) > 1 && (
        <Button
          onClick={() => handleNavigation("prev")}
          className="light-border-2 btn flex min-h-[36px] items-center justify-center gap-2 border"
        >
          <p className="body-medium text-dark200_light800">Prev</p>
        </Button>
      )}

      <div className="flex items-center jusify-center rounded-md bg-primary-500 px-3.5 py-2">
        <p className="body-semibold text-light-900">{page}</p>
      </div>

      {/* Next Page Button */}
      {isNext && (
        <Button
          onClick={() => handleNavigation("next")}
          className="light-border-2 btn flex min-h-[36px] items-center justify-center gap-2 border"
        >
          <p className="body-medium text-dark200_light800">Next</p>
        </Button>
      )}
    </div>
  );
};

export default Pagination;
