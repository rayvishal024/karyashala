import { DocEditorView } from "@/features/workspace-docs";

export default async function WorkspaceDocPage({
     params,
}: {
     params: Promise<{ slug: string; docId: string }>;
}) {
     const { docId } = await params;
     return <DocEditorView docId={docId} />;
}
