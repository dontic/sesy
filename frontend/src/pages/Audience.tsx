import { useEffect, useRef, useState } from "react";

import { Filter, MoreHorizontal, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import CreateAudienceMemberDialog from "@/components/audience/CreateAudienceMemberDialog";
import DeleteAudienceMemberDialog from "@/components/audience/DeleteAudienceMemberDialog";
import EditAudienceMemberDialog from "@/components/audience/EditAudienceMemberDialog";
import ImportCsvDialog from "@/components/audience/ImportCsvDialog";
import ManageTagsDialog from "@/components/audience/ManageTagsDialog";
import SideBarLayout from "@/layouts/SideBarLayout";
import { sesyProjectsMembersList } from "@/api/django/audience-members/audience-members";
import { sesyProjectsTagsList } from "@/api/django/tags/tags";
import type { AudienceMember, Tag } from "@/api/django/djangoAPI.schemas";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);

  // Search & filter state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [subscribedFilter, setSubscribedFilter] = useState<"all" | "subscribed" | "unsubscribed">("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const activeFilterCount =
    (subscribedFilter !== "all" ? 1 : 0) + (tagFilter ? 1 : 0);

  // Load tags for filter menu
  useEffect(() => {
    if (!currentProject) return;
    sesyProjectsTagsList(String(currentProject.pk)).then(setTags);
  }, [currentProject]);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    const params: Parameters<typeof sesyProjectsMembersList>[1] = {
      page,
      page_size: PAGE_SIZE
    };
    if (search) params.search = search;
    if (subscribedFilter !== "all") params.subscribed = subscribedFilter === "subscribed";
    if (tagFilter) params.tag = tagFilter;

    sesyProjectsMembersList(String(currentProject.pk), params)
      .then((res) => {
        setMembers(res.results);
        setCount(res.count);
      })
      .finally(() => setLoading(false));
  }, [currentProject, page, search, subscribedFilter, tagFilter]);

  const handleSaved = (updated: AudienceMember) => {
    setMembers((prev) => prev.map((m) => (m.pk === updated.pk ? updated : m)));
  };

  const handleDeleted = (pk: number) => {
    setMembers((prev) => prev.filter((m) => m.pk !== pk));
    setCount((c) => c - 1);
  };

  const handleCreated = (member: AudienceMember) => {
    setMembers((prev) => [member, ...prev]);
    setCount((c) => c + 1);
  };

  const handleImported = () => {
    if (!currentProject) return;
    setLoading(true);
    sesyProjectsMembersList(String(currentProject.pk), {
      page: 1,
      page_size: PAGE_SIZE
    })
      .then((res) => {
        setMembers(res.results);
        setCount(res.count);
        setPage(1);
      })
      .finally(() => setLoading(false));
  };

  const clearFilters = () => {
    setSubscribedFilter("all");
    setTagFilter("");
    setPage(1);
  };

  const headerActions = currentProject ? (
    <>
      <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <Button size="sm" onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4" />
        <span className="md:block hidden">Add Member</span>
      </Button>
    </>
  ) : null;

  return (
    <SideBarLayout title="Audience" actions={headerActions}>
      <div className="flex flex-col gap-4 items-center h-full w-full p-4">
        {/* Search & Filter bar */}
        <div className="flex items-center gap-2 w-full max-w-5xl">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by email or name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">Status</span>
                  <Select
                    value={subscribedFilter}
                    onValueChange={(v) => {
                      setSubscribedFilter(v as typeof subscribedFilter);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="subscribed">Subscribed</SelectItem>
                      <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Tag</span>
                    <Select
                      value={tagFilter || "__all__"}
                      onValueChange={(v) => {
                        setTagFilter(v === "__all__" ? "" : v);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All tags</SelectItem>
                        {tags.map((tag) => (
                          <SelectItem key={tag.pk} value={tag.name}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full"
                    onClick={() => {
                      clearFilters();
                      setFilterOpen(false);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-h-0 w-full max-w-5xl overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  Tags
                  {currentProject && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => setManageTagsOpen(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
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
                    <div className="flex flex-wrap gap-1">
                      {member.tags_detail.length > 0 ? (
                        member.tags_detail.map((tag) => (
                          <Badge key={tag.pk} variant="outline">
                            {tag.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
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
                        <DropdownMenuItem
                          onClick={() => setEditingMember(member)}
                        >
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
        </div>

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
          onOpenChange={(open) => {
            if (!open) setDeletingMember(null);
          }}
          onDeleted={handleDeleted}
        />
      )}

      {editingMember && currentProject && (
        <EditAudienceMemberDialog
          member={editingMember}
          projectPk={String(currentProject.pk)}
          open={!!editingMember}
          onOpenChange={(open) => {
            if (!open) setEditingMember(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {currentProject && (
        <CreateAudienceMemberDialog
          projectPk={String(currentProject.pk)}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleCreated}
        />
      )}

      {currentProject && (
        <ImportCsvDialog
          projectPk={String(currentProject.pk)}
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={handleImported}
        />
      )}

      {currentProject && (
        <ManageTagsDialog
          projectPk={String(currentProject.pk)}
          open={manageTagsOpen}
          onOpenChange={setManageTagsOpen}
        />
      )}
    </SideBarLayout>
  );
};

export default Audience;
