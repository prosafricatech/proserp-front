"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Highcharts from "highcharts";
import { Button, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from "@mui/material";
import { HighlightOff } from "@mui/icons-material";
import dayjs from "dayjs";
import { useProjectProfile } from "../../ProjectProfileProvider";
import { BackdropSpinner } from "@/shared/ProgressIndicators/BackdropSpinner";

const HighchartsReact = dynamic(() => import("highcharts-react-official"), {
  ssr: false,
});

function GanttChart({ setOpenGanttChart }) {
  const { project, projectTimelineActivities } = useProjectProfile();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadModules() {
      try {
        const ganttModule = await import("highcharts/modules/gantt");
        const exportingModule = await import("highcharts/modules/exporting");
        const exportDataModule = await import("highcharts/modules/export-data");
        const offlineExportingModule = await import("highcharts/modules/offline-exporting");

        const modules = [ganttModule, exportingModule, exportDataModule, offlineExportingModule];

        modules.forEach((mod) => {
          const initFn = (mod).default || mod;
          if (typeof initFn === "function") {
            initFn(Highcharts);
          }
        });

      } catch (err) {
        console.error("Failed to load Highcharts modules:", err);
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    loadModules();

    return () => { mounted = false; };
  }, []);

  if (!isReady) {
    return <BackdropSpinner/>;
  }

  // --- Transform activities into Gantt data ---
  const toGanttSeriesData = (groups) => {
    if (!Array.isArray(groups)) return [];

    const flattenGroups = (groupList, grpName) => {
      return groupList
        .sort((a, b) => a.position_index - b.position_index)
        .flatMap(group => {
          const groupData = {
            id: 'activity_' + group.id,
            name: group.name,
            parent: grpName,
          };

          const sortedTasks = (group.tasks || []).sort((a, b) => a.position_index - b.position_index);

          const taskData = sortedTasks.flatMap(task => {
            const taskItem = {
              id: 'task_' + task.id,
              name: task.name,
              handlers: task.handlers,
              parent: 'activity_' + group.id,
              milestone: task.is_milestone === 1,
              isTask: true,
              weighted_percentage: task.weighted_percentage,
              dependency: (task.dependencies || []).map(dep => 'task_' + dep.id),
              className: task.is_milestone ? 'milestone-task' : '',
              start: Date.UTC(dayjs(task.start_date).year(), dayjs(task.start_date).month(), dayjs(task.start_date).date()),
              end: Date.UTC(dayjs(task.end_date).year(), dayjs(task.end_date).month(), dayjs(task.end_date).date()),
              marker: task.is_milestone === 1 ? {
                symbol: 'diamond',
                radius: 10,
                fillColor: '#ff0000',
              } : {},
            };

            return [taskItem];
          });

          const childGroupData = flattenGroups(group.children || [], 'activity_' + group.id);

          return [groupData, ...taskData, ...childGroupData];
        });
    };

    return flattenGroups(groups);
  };

  const ganttData = toGanttSeriesData(projectTimelineActivities);

  const day = 24 * 36e5,
  today = Math.floor(Date.now() / day) * day;

  const minDate = ganttData.reduce((earliest, task) => {
    const taskStart = task.start || today;
    return taskStart < earliest ? taskStart : earliest;
  }, today);

  const maxDate = ganttData.reduce((latest, task) => {
    const taskEnd = task.end || today;
    return taskEnd > latest ? taskEnd : latest;
  }, today);

  const chartOptions = {
    chart: {
      plotBackgroundColor: 'rgba(128,128,128,0.02)',
      plotBorderColor: 'rgba(128,128,128,0.1)',
      plotBorderWidth: 1,
    },
    xAxis: [{
      min: minDate,
      max: maxDate, 
      currentDateIndicator: {
        color: '#2caffe',
        dashStyle: 'ShortDot',
        width: 2,
        label: {
          format: ''
        }
      },
      dateTimeLabelFormats: {
        day: '%e<br><span style="opacity: 0.5; font-size: 0.7em">%a</span>'
      },
      grid: {
        borderWidth: 0
      },
      gridLineWidth: 1,
      custom: {
        today,
        weekendPlotBands: true
      }
    }],
    yAxis: {
      grid: {
        borderWidth: 0,
      },
      gridLineWidth: 0,
      labels: {
        symbol: {
          width: 8,
          height: 6,
          x: -4,
          y: -2,
        },
      },
      staticScale: 30,
    },
    plotOptions: {
      series: {
        cursor: 'pointer',
        borderRadius: '50%',
        connectors: {
          dashStyle: 'ShortDot',
          lineWidth: 2,
          radius: 5,
          startMarker: {
            enabled: false,
          },
        },
        point: {
          events: {
            mouseOver: function () {
              const chart = this.series.chart;
              chart.series.forEach(function (series) {
                series.points.forEach(function (point) {
                  if (point !== this && point.graphic) {
                    point.graphic.attr({
                      opacity: 0.3,
                    });
                  }
                }, this);
              }, this);
            },
            mouseOut: function () {
              const chart = this.series.chart;
              chart.series.forEach(function (series) {
                series.points.forEach(function (point) {
                  if (point.graphic) {
                    point.graphic.attr({
                      opacity: 1,
                    });
                  }
                });
              });
            },
          },
        },
        tooltip: {
          pointFormatter: function () {
            const startDate = this.start ? Highcharts.dateFormat('%d %b %Y', this.start) : 'Unknown start date';
            const endDate = this.milestone ? '' : (this.end ? ` → ${Highcharts.dateFormat('%d %b %Y', this.end)}` : '');
  
            let handlerInfo = '';
            if (this.handlers && this.handlers.length > 0) {
              const handlerNames = this.handlers.map(handler => handler.name).join(', ');
              handlerInfo = `Handler(s): ${handlerNames}<br>`;
            } else if (this.isTask === true) {
              handlerInfo = 'Handler(s): unassigned<br>';
            }
  
            return `<span style="font-weight: bold">${this.name}</span><br>` +
              `${startDate}${endDate}<br>` +
              handlerInfo;
          }
        },
        groupPadding: 0,
        dataLabels: [
          {
            enabled: true,
            align: 'left',
            format: '{point.name}',
            padding: 10,
            style: {
              fontWeight: 'normal',
              textOutline: 'none',
            },
          },
          {
            enabled: true,
            align: 'right',
            padding: 10,
            style: {
              fontWeight: 'normal',
              textOutline: 'none',
              opacity: 0.6,
            },
          },
        ],
      },
    },
    navigator: {
      enabled: true,
      liveRedraw: true,
      series: {
        type: 'gantt',
        pointPlacement: 0.5,
        pointPadding: 0.25,
        accessibility: {
          enabled: false
        }
      },
      yAxis: {
        min: 0,
        max: 3,
        reversed: true,
        categories: []
      }
    },
    scrollbar: {
      enabled: true
    },
    rangeSelector: {
      enabled: true,
      selected: 5
    },
    series: [
      {
        name: '',
        data: ganttData,
      },
    ],
  };

  return (
    <>
      <DialogTitle
        style={{
          textAlign: "center",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ flexGrow: 1, textAlign: "center" }}>
          {`${project.name} Gantt Chart`}
        </span>
        <Tooltip title="Close">
          <IconButton
            size="small"
            color="primary"
            onClick={() => setOpenGanttChart(false)}
          >
            <HighlightOff color="primary" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType="ganttChart"
          options={chartOptions}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpenGanttChart(false)}>Close</Button>
      </DialogActions>
    </>
  );
}

export default GanttChart;
