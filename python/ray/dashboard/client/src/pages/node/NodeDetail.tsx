import { Box, Grid, Switch, Tab, TableContainer, Tabs } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";
import { formatDateFromTimeMs } from "../../common/formatUtils";
import ActorTable from "../../components/ActorTable";
import Loading from "../../components/Loading";
import PercentageBar from "../../components/PercentageBar";
import { StatusChip } from "../../components/StatusChip";
import TitleCard from "../../components/TitleCard";
import RayletWorkerTable from "../../components/WorkerTable";
import { memoryConverter } from "../../util/converter";
import { MainNavPageInfo } from "../layout/mainNavContext";
import { useNodeDetail } from "./hook/useNodeDetail";

const NodeDetailPage = () => {
  const {
    params,
    selectedTab,
    nodeDetail,
    msg,
    isLoading,
    isRefreshing,
    onRefreshChange,
    raylet,
    handleChange,
  } = useNodeDetail();

  return (
    <Box sx={{ padding: 2 }}>
      <MainNavPageInfo
        pageInfo={{
          title: `Node: ${params.id}`,
          pageTitle: `${params.id} | Node`,
          id: "node-detail",
          path: `/cluster/nodes/${params.id}`,
        }}
      />
      <Loading loading={isLoading} />
      <TitleCard title={`NODE - ${params.id}`}>
        <StatusChip
          type="node"
          status={nodeDetail?.raylet?.state || "LOADING"}
        />
        <br />
        Auto Refresh:
        <Switch
          checked={isRefreshing}
          onChange={onRefreshChange}
          name="refresh"
          inputProps={{ "aria-label": "secondary checkbox" }}
        />
        <br />
        Request Status: {msg}
      </TitleCard>
      <TitleCard title="Node Detail">
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          sx={{ marginBottom: 2 }}
        >
          <Tab value="info" label="Info" />
          <Tab value="raylet" label="Raylet" />
          <Tab
            value="worker"
            label={`Worker (${nodeDetail?.workers.length || 0})`}
          />
          <Tab
            value="actor"
            label={`Actor (${Object.values(nodeDetail?.actors || {}).length || 0
              })`}
          />
          <Tab value="infrastructure" label="Infrastructure" />
        </Tabs>
        {nodeDetail && selectedTab === "info" && (
          <Box sx={{ padding: 2, marginTop: 2, marginBottom: 2 }}>
            <Grid container>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>Hostname</Box>{" "}
                {nodeDetail.hostname}
              </Grid>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>IP</Box> {nodeDetail.ip}
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs>
                {nodeDetail.cpus && (
                  <React.Fragment>
                    <Box sx={{ fontWeight: "bold" }}>CPU (Logic/Physic)</Box>{" "}
                    {nodeDetail.cpus[0]}/ {nodeDetail.cpus[1]}
                  </React.Fragment>
                )}
              </Grid>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>Load (1/5/15min)</Box>{" "}
                {nodeDetail?.loadAvg[0] &&
                  nodeDetail.loadAvg[0]
                    .map((e) => Number(e).toFixed(2))
                    .join("/")}
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>Load per CPU (1/5/15min)</Box>{" "}
                {nodeDetail?.loadAvg[1] &&
                  nodeDetail.loadAvg[1]
                    .map((e) => Number(e).toFixed(2))
                    .join("/")}
              </Grid>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>Boot Time</Box>{" "}
                {formatDateFromTimeMs(nodeDetail.bootTime * 1000)}
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>Sent Tps</Box>{" "}
                {memoryConverter(nodeDetail?.networkSpeed[0])}/s
              </Grid>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>Received Tps</Box>{" "}
                {memoryConverter(nodeDetail?.networkSpeed[1])}/s
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>Memory</Box>{" "}
                {nodeDetail?.mem && (
                  <PercentageBar
                    num={Number(nodeDetail?.mem[0] - nodeDetail?.mem[1])}
                    total={nodeDetail?.mem[0]}
                  >
                    {memoryConverter(nodeDetail?.mem[0] - nodeDetail?.mem[1])}/
                    {memoryConverter(nodeDetail?.mem[0])}({nodeDetail?.mem[2]}%)
                  </PercentageBar>
                )}
              </Grid>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>CPU</Box>{" "}
                <PercentageBar num={Number(nodeDetail.cpu)} total={100}>
                  {nodeDetail.cpu}%
                </PercentageBar>
              </Grid>
            </Grid>
            <Grid container>
              {nodeDetail?.disk &&
                Object.entries(nodeDetail?.disk).map(([path, obj]) => (
                  <Grid item xs={6} key={path}>
                    <Box sx={{ fontWeight: "bold" }}>Disk ({path})</Box>{" "}
                    {obj && (
                      <PercentageBar num={Number(obj.used)} total={obj.total}>
                        {memoryConverter(obj.used)}/{memoryConverter(obj.total)}
                        ({obj.percent}%, {memoryConverter(obj.free)} free)
                      </PercentageBar>
                    )}
                  </Grid>
                ))}
            </Grid>
            <Grid container>
              <Grid item xs>
                <Box sx={{ fontWeight: "bold" }}>Logs</Box>{" "}
                <Link
                  to={`/logs/?nodeId=${encodeURIComponent(
                    nodeDetail.raylet.nodeId,
                  )}`}
                >
                  log
                </Link>
              </Grid>
            </Grid>
          </Box>
        )}
        {raylet && Object.keys(raylet).length > 0 && selectedTab === "raylet" && (
          <React.Fragment>
            <Box
              sx={{
                padding: 2,
                marginTop: 2,
                marginBottom: 2,
              }}
            >
              <Grid container>
                <Grid item xs>
                  <Box sx={{ fontWeight: "bold" }}>Command</Box>
                  <br />
                  <div style={{ height: 200, overflow: "auto" }}>
                    {nodeDetail?.cmdline.join(" ")}
                  </div>
                </Grid>
              </Grid>
              <Grid container>
                <Grid item xs>
                  <Box sx={{ fontWeight: "bold" }}>Pid</Box> {raylet?.pid}
                </Grid>
                <Grid item xs>
                  <Box sx={{ fontWeight: "bold" }}>Workers Num</Box>{" "}
                  {raylet?.numWorkers}
                </Grid>
                <Grid item xs>
                  <Box sx={{ fontWeight: "bold" }}>Node Manager Port</Box>{" "}
                  {raylet?.nodeManagerPort}
                </Grid>
              </Grid>
            </Box>
          </React.Fragment>
        )}
        {nodeDetail?.workers && selectedTab === "worker" && (
          <React.Fragment>
            <TableContainer
              sx={{
                padding: 2,
                marginTop: 2,
                marginBottom: 2,
              }}
            >
              <RayletWorkerTable
                workers={nodeDetail?.workers}
                actorMap={nodeDetail?.actors}
              />
            </TableContainer>
          </React.Fragment>
        )}
        {nodeDetail?.actors && selectedTab === "actor" && (
          <React.Fragment>
            <TableContainer
              sx={{
                padding: 2,
                marginTop: 2,
                marginBottom: 2,
              }}
            >
              <ActorTable
                actors={nodeDetail.actors}
                workers={nodeDetail?.workers}
                detailPathPrefix="/actors"
              />
            </TableContainer>
          </React.Fragment>
        )}
        {nodeDetail && selectedTab === "infrastructure" && (
          <Box sx={{ padding: 2, marginTop: 2, marginBottom: 2 }}>
            {nodeDetail.infrastructure ? (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ fontWeight: "bold", fontSize: "1.2em", marginBottom: 2 }}>
                      Platform Information
                    </Box>
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ fontWeight: "bold" }}>Platform Type</Box>
                    <Box sx={{ textTransform: "capitalize" }}>
                      {nodeDetail.infrastructure?.platform?.platformType?.replace('_', ' ') || 'Unknown'}
                    </Box>
                  </Grid>
                </Grid>

                {((nodeDetail.infrastructure?.platform?.platformType === "kubernetes")) &&
                  (nodeDetail.infrastructure?.platformDetails) && (
                    <>
                      <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        <Grid item xs={12}>
                          <Box sx={{ fontWeight: "bold", fontSize: "1.1em", marginBottom: 1 }}>
                            Kubernetes Information
                          </Box>
                        </Grid>
                      </Grid>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ fontWeight: "bold" }}>Pod Name</Box>
                          <Box>{(nodeDetail.infrastructure?.platformDetails?.podName) || 'Unknown'}</Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ fontWeight: "bold" }}>Namespace</Box>
                          <Box>{(nodeDetail.infrastructure?.platformDetails?.namespace) || 'default'}</Box>
                        </Grid>
                      </Grid>
                      {((nodeDetail.infrastructure?.platformDetails?.nodeName)) && (
                        <Grid container spacing={2} sx={{ marginTop: 1 }}>
                          <Grid item xs={6}>
                            <Box sx={{ fontWeight: "bold" }}>Kubernetes Node</Box>
                            <Box>{(nodeDetail.infrastructure?.platformDetails?.nodeName)}</Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ fontWeight: "bold" }}>Service Account</Box>
                            <Box>{(nodeDetail.infrastructure?.platformDetails?.serviceAccount) || "default"}</Box>
                          </Grid>
                        </Grid>
                      )}
                    </>
                  )}

                {((nodeDetail.infrastructure?.platform?.platformType === "container")) &&
                  (nodeDetail.infrastructure?.platformDetails) && (
                    <>
                      <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        <Grid item xs={12}>
                          <Box sx={{ fontWeight: "bold", fontSize: "1.1em", marginBottom: 1 }}>
                            Container Information
                          </Box>
                        </Grid>
                      </Grid>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ fontWeight: "bold" }}>Container ID</Box>
                          <Box>{(
                            nodeDetail.infrastructure?.platformDetails?.containerId) || "Unknown"}</Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ fontWeight: "bold" }}>Cgroup Version</Box>
                          <Box>{(
                            nodeDetail.infrastructure?.platformDetails?.cgroupInfo?.cgroupVersion) || "Unknown"}</Box>
                        </Grid>
                      </Grid>
                    </>
                  )}

                {nodeDetail.infrastructure.error && (
                  <Grid container spacing={2} sx={{ marginTop: 2 }}>
                    <Grid item xs={12}>
                      <Box sx={{ fontWeight: "bold", color: "error.main" }}>
                        Detection Error
                      </Box>
                      <Box sx={{ color: "error.main" }}>
                        {nodeDetail.infrastructure.error}
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: "center", color: "text.secondary", padding: 4 }}>
                No infrastructure information available.
                <br />
                This feature requires Ray 2.x+ and may not be supported on all platforms.
              </Box>
            )}
          </Box>
        )}
      </TitleCard>
    </Box>
  );
};

export default NodeDetailPage;
