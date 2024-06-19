import {Fragment} from 'react';
import {useTheme} from '@emotion/react';
import styled from '@emotion/styled';

import {LinkButton} from 'sentry/components/button';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {useLocation} from 'sentry/utils/useLocation';
import PerformanceScoreRingWithTooltips from 'sentry/views/insights/browser/webVitals/components/performanceScoreRingWithTooltips';
import {useProjectRawWebVitalsQuery} from 'sentry/views/insights/browser/webVitals/queries/rawWebVitalsQueries/useProjectRawWebVitalsQuery';
import {calculatePerformanceScoreFromStoredTableDataRow} from 'sentry/views/insights/browser/webVitals/queries/storedScoreQueries/calculatePerformanceScoreFromStored';
import {useProjectWebVitalsScoresQuery} from 'sentry/views/insights/browser/webVitals/queries/storedScoreQueries/useProjectWebVitalsScoresQuery';
import {useModuleURL} from 'sentry/views/performance/utils/useModuleURL';

import {GenericPerformanceWidget} from '../components/performanceWidget';
import {Subtitle, WidgetEmptyStateWarning} from '../components/selectableList';
import type {PerformanceWidgetProps} from '../types';

export function PerformanceScoreWidget(props: PerformanceWidgetProps) {
  const location = useLocation();
  const {InteractiveTitle} = props;
  const theme = useTheme();
  const {data: projectData, isLoading} = useProjectRawWebVitalsQuery();
  const {data: projectScores, isLoading: isProjectScoresLoading} =
    useProjectWebVitalsScoresQuery();

  const noTransactions = !isLoading && !projectData?.data?.[0]?.['count()'];

  const projectScore =
    isProjectScoresLoading || isLoading || noTransactions
      ? undefined
      : calculatePerformanceScoreFromStoredTableDataRow(projectScores?.data?.[0]);
  const ringSegmentColors = theme.charts.getColorPalette(3);
  const ringBackgroundColors = ringSegmentColors.map(color => `${color}50`);

  const weights = projectScore
    ? {
        lcp: projectScore.lcpWeight,
        fcp: projectScore.fcpWeight,
        inp: projectScore.inpWeight,
        fid: 0,
        cls: projectScore.clsWeight,
        ttfb: projectScore.ttfbWeight,
      }
    : undefined;

  const moduleURL = useModuleURL('vital');

  return (
    <GenericPerformanceWidget
      {...props}
      location={location}
      Subtitle={() => <Subtitle>{props.subTitle}</Subtitle>}
      HeaderActions={() => (
        <div>
          <LinkButton to={`${moduleURL}/`} size="sm">
            {t('View All')}
          </LinkButton>
        </div>
      )}
      InteractiveTitle={
        InteractiveTitle ? () => <InteractiveTitle isLoading={false} /> : null
      }
      EmptyComponent={WidgetEmptyStateWarning}
      Queries={{
        project: {
          component: provided => {
            const loading = isProjectScoresLoading;
            const data = projectScores;
            return (
              <Fragment>
                {provided.children({
                  data,
                  isLoading: loading,
                  hasData: !loading && (data?.data?.[0]?.['count()'] as number) > 0,
                })}
              </Fragment>
            );
          },
          fields: [],
          transform: function (_: any, results: any) {
            return results;
          },
        },
      }}
      Visualizations={[
        {
          component: () => (
            <Wrapper>
              {projectScore && !noTransactions ? (
                <PerformanceScoreRingWithTooltips
                  inPerformanceWidget
                  projectScore={projectScore}
                  projectData={projectData}
                  y={40}
                  text={
                    <span style={{fontSize: 'xxx-large'}}>{projectScore.totalScore}</span>
                  }
                  width={280}
                  height={240}
                  size={160}
                  barWidth={16}
                  ringBackgroundColors={ringBackgroundColors}
                  ringSegmentColors={ringSegmentColors}
                  radiusPadding={10}
                  labelHeightPadding={0}
                  weights={weights}
                />
              ) : isLoading ? (
                <StyledLoadingIndicator size={40} />
              ) : (
                <WidgetEmptyStateWarning />
              )}
            </Wrapper>
          ),
          height: 124 + props.chartHeight,
          noPadding: true,
        },
      ]}
    />
  );
}

const Wrapper = styled('div')`
  padding-top: 10px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${p => p.theme.gray200};
  margin-top: ${space(1)};
`;

const StyledLoadingIndicator = styled(LoadingIndicator)`
  margin: 0;
`;
