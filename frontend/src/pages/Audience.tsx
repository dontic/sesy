import { useEffect, useState } from "react";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeleteAudienceMemberDialog from "@/components/audience/DeleteAudienceMemberDialog";
import EditAudienceMemberDialog from "@/components/audience/EditAudienceMemberDialog";
import SideBarLayout from "@/layouts/SideBarLayout";
import { sesyProjectsMembersList } from "@/api/django/audience-members/audience-members";
import type { AudienceMember } from "@/api/django/djangoAPI.schemas";
import { useProjectStore } from "@/stores/ProjectStore";

const PAGE_SIZE = 20;

const Audience = () => {
  const { currentProject } = useProjectStore();
  const [members, setMembers] = useState<AudienceMember[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<AudienceMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<AudienceMember | null>(null);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    sesyProjectsMembersList(String(currentProject.pk), {
      page,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        setMembers(res.results);
        setCount(res.count);
      })
      .finally(() => setLoading(false));
  }, [currentProject, page]);

  const handleSaved = (updated: AudienceMember) => {
    setMembers((prev) => prev.map((m) => (m.pk === updated.pk ? updated : m)));
  };

  const handleDeleted = (pk: number) => {
    setMembers((prev) => prev.filter((m) => m.pk !== pk));
    setCount((c) => c - 1);
  };

  return (
    <SideBarLayout title="Audience">
      <div className="flex flex-col gap-4 items-center">
        <Table className="max-w-5xl">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No audience members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.pk}>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.first_name ?? "—"}</TableCell>
                  <TableCell>{member.last_name ?? "—"}</TableCell>
                  <TableCell>
                    {member.subscribed ? (
                      <Badge variant="default">Subscribed</Badge>
                    ) : (
                      <Badge variant="secondary">Unsubscribed</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingMember(member)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingMember(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between w-full max-w-5xl">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({count} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {deletingMember && currentProject && (
        <DeleteAudienceMemberDialog
          member={deletingMember}
          projectPk={String(currentProject.pk)}
          open={!!deletingMember}
          onOpenChange={(open) => { if (!open) setDeletingMember(null); }}
          onDeleted={handleDeleted}
        />
      )}

      {editingMember && currentProject && (
        <EditAudienceMemberDialog
          member={editingMember}
          projectPk={String(currentProject.pk)}
          open={!!editingMember}
          onOpenChange={(open) => { if (!open) setEditingMember(null); }}
          onSaved={handleSaved}
        />
      )}
    </SideBarLayout>
  );
};

export default Audience;
