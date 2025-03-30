import type { IssuesQuery } from "@/graphql/linear.client";
import type { GithubAttachmentMeta } from "@/types/linear";

export type Issue = IssuesQuery["issues"]["nodes"][number];
export type Attachment = Omit<
  Issue["attachments"]["nodes"][number],
  "metadata"
> & {
  metadata: GithubAttachmentMeta;
};
