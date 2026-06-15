"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  addComment,
  deleteComment,
  updateComment,
} from "@/lib/actions/recipes";
import type { RecipeComment } from "@/types/database";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface CommentsSectionProps {
  recipeId: string;
  comments: (RecipeComment & { profile?: { display_name: string; avatar_url: string | null } })[];
  currentUserId?: string;
}

export function CommentsSection({
  recipeId,
  comments: initialComments,
  currentUserId,
}: CommentsSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await addComment(recipeId, newComment.trim());
      setNewComment("");
      toast.success("Kommentar hinzugefügt");
      router.refresh();
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(commentId: string) {
    try {
      await updateComment(commentId, editContent);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: editContent } : c
        )
      );
      setEditingId(null);
      toast.success("Kommentar aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren");
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Kommentar gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        Kommentare ({comments.length})
      </h3>

      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Schreibe einen Kommentar…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" size="sm" disabled={loading || !newComment.trim()}>
            Kommentieren
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={comment.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {comment.profile?.display_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {comment.profile?.display_name || "Unbekannt"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              </div>
              {editingId === comment.id ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(comment.id)}>
                      Speichern
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm">{comment.content}</p>
              )}
              {currentUserId === comment.user_id && editingId !== comment.id && (
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="inline h-3 w-3" /> Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="inline h-3 w-3" /> Löschen
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
