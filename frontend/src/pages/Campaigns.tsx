import { useEffect, useState } from "react";

import {
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import CreateCampaignDialog from "@/components/campaigns/CreateCampaignDialog";
import DeleteCampaignDialog from "@/components/campaigns/DeleteCampaignDialog";
import EditCampaignDialog from "@/components/campaigns/EditCampaignDialog";
import SendCampaignDialog from "@/components/campaigns/SendCampaignDialog";
import SideBarLayout from "@/layouts/SideBarLayout";
import { sesyProjectsCampaignsList } from "@/api/django/campaigns/campaigns";
import type { Campaign } from "@/api/django/djangoAPI.schemas";
import { useProjectStore } from "@/stores/ProjectStore";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  sending: "default",
  sent: "outline",
  failed: "destructive",
};

const Campaigns = () => {
  const { currentProject } = useProjectStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(
    null
  );
  const [sendingCampaign, setSendingCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    sesyProjectsCampaignsList(String(currentProject.pk))
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, [currentProject]);

  const handleCreated = (campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
  };

  const handleSaved = (updated: Campaign) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.pk === updated.pk ? updated : c))
    );
  };

  const handleDeleted = (pk: number) => {
    setCampaigns((prev) => prev.filter((c) => c.pk !== pk));
  };

  const handleSent = (updated: Campaign) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.pk === updated.pk ? updated : c))
    );
  };

  const headerActions = currentProject ? (
    <Button size="sm" onClick={() => setCreateOpen(true)}>
      <Plus className="h-4 w-4" />
      <span className="md:block hidden">New Campaign</span>
    </Button>
  ) : null;

  return (
    <SideBarLayout title="Campaigns" actions={headerActions}>
      <div className="flex flex-col gap-4 items-center w-full overflow-y-auto p-4">
        <Table className="max-w-5xl">
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No campaigns yet. Create your first campaign.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.pk}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {campaign.from_name && (
                        <span className="text-sm">{campaign.from_name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {campaign.from_email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {campaign.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[campaign.status] ?? "secondary"}>
                      {campaign.status.charAt(0).toUpperCase() +
                        campaign.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.send_to_all ? (
                      <span className="text-sm">All subscribers</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {campaign.tags_detail.length > 0 ? (
                          campaign.tags_detail.map((tag) => (
                            <Badge key={tag.pk} variant="outline">
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No tags
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {campaign.sent_at
                      ? new Date(campaign.sent_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {campaign.status === "draft" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setSendingCampaign(campaign)}
                            >
                              <Send className="h-4 w-4" />
                              Send
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => setEditingCampaign(campaign)}
                          disabled={
                            campaign.status === "sending"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingCampaign(campaign)}
                          disabled={campaign.status === "sending"}
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

      {currentProject && (
        <CreateCampaignDialog
          projectPk={String(currentProject.pk)}
          projectDomain={currentProject.domain?.domain ?? ""}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleCreated}
        />
      )}

      {editingCampaign && currentProject && (
        <EditCampaignDialog
          campaign={editingCampaign}
          projectPk={String(currentProject.pk)}
          projectDomain={currentProject.domain?.domain ?? ""}
          open={!!editingCampaign}
          onOpenChange={(open) => {
            if (!open) setEditingCampaign(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {deletingCampaign && currentProject && (
        <DeleteCampaignDialog
          campaign={deletingCampaign}
          projectPk={String(currentProject.pk)}
          open={!!deletingCampaign}
          onOpenChange={(open) => {
            if (!open) setDeletingCampaign(null);
          }}
          onDeleted={handleDeleted}
        />
      )}

      {sendingCampaign && currentProject && (
        <SendCampaignDialog
          campaign={sendingCampaign}
          projectPk={String(currentProject.pk)}
          open={!!sendingCampaign}
          onOpenChange={(open) => {
            if (!open) setSendingCampaign(null);
          }}
          onSent={handleSent}
        />
      )}
    </SideBarLayout>
  );
};

export default Campaigns;
