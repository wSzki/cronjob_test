import { useState } from 'react';
import { Loading } from 'react-basics';
import ErrorMessage from 'components/common/ErrorMessage';
import useApi from 'hooks/useApi';
import useDateRange from 'hooks/useDateRange';
import usePageQuery from 'hooks/usePageQuery';
import { formatShortTime, formatNumber, formatLongNumber } from 'lib/format';
import MetricCard from './MetricCard';
import useMessages from 'hooks/useMessages';
import styles from './MetricsBar.module.css';

export default function MetricsBar({ websiteId }) {
  const { formatMessage, labels } = useMessages();
  const { get, useQuery } = useApi();
  const [dateRange] = useDateRange(websiteId);
  const { startDate, endDate, modified } = dateRange;
  const [format, setFormat] = useState(true);
  const {
    query: { url, referrer, os, browser, device, country, region, city },
  } = usePageQuery();

  const { data, error, isLoading, isFetched } = useQuery(
    [
      'websites:stats',
      { websiteId, modified, url, referrer, os, browser, device, country, region, city },
    ],
    () =>
      get(`/websites/${websiteId}/stats`, {
        startAt: +startDate,
        endAt: +endDate,
        url,
        referrer,
        os,
        browser,
        device,
        country,
        region,
        city,
      }),
  );

  const formatFunc = format
    ? n => (n >= 0 ? formatLongNumber(n) : `-${formatLongNumber(Math.abs(n))}`)
    : formatNumber;

  function handleSetFormat() {
    setFormat(state => !state);
  }

  const { pageviews, uniques, bounces, totaltime } = data || {};
  const num = Math.min(data && uniques.value, data && bounces.value);
  const diffs = data && {
    pageviews: pageviews.value - pageviews.change,
    uniques: uniques.value - uniques.change,
    bounces: bounces.value - bounces.change,
    totaltime: totaltime.value - totaltime.change,
  };

  return (
    <div className={styles.bar} onClick={handleSetFormat}>
      {isLoading && !isFetched && <Loading icon="dots" />}
      {error && <ErrorMessage />}
      {data && !error && isFetched && (
        <>
          <MetricCard
            className={styles.card}
            label={formatMessage(labels.views)}
            value={pageviews.value}
            change={pageviews.change}
            format={formatFunc}
          />
          <MetricCard
            className={styles.card}
            label={formatMessage(labels.visitors)}
            value={uniques.value}
            change={uniques.change}
            format={formatFunc}
          />
          <MetricCard
            className={styles.card}
            label={formatMessage(labels.bounceRate)}
            value={uniques.value ? (num / uniques.value) * 100 : 0}
            change={
              uniques.value && uniques.change
                ? (num / uniques.value) * 100 -
                    (Math.min(diffs.uniques, diffs.bounces) / diffs.uniques) * 100 || 0
                : 0
            }
            format={n => Number(n).toFixed(0) + '%'}
            reverseColors
          />
          <MetricCard
            className={styles.card}
            label={formatMessage(labels.averageVisitTime)}
            value={
              totaltime.value && pageviews.value
                ? totaltime.value / (pageviews.value - bounces.value)
                : 0
            }
            change={
              totaltime.value && pageviews.value
                ? (diffs.totaltime / (diffs.pageviews - diffs.bounces) -
                    totaltime.value / (pageviews.value - bounces.value)) *
                    -1 || 0
                : 0
            }
            format={n => `${n < 0 ? '-' : ''}${formatShortTime(Math.abs(~~n), ['m', 's'], ' ')}`}
          />
        </>
      )}
    </div>
  );
}