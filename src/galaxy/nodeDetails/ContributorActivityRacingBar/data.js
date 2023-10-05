import { avatarColorStore } from './AvatarColorStore';

import { orderBy, take } from 'lodash-es';

const DARK_TEXT_COLOR = 'rgba(230, 237, 243, 0.9)';

/**
 * Count the number of unique contributors in the data
 * @returns [number of long term contributors, contributors' names]
 */
export const countLongTermContributors = (data) => {
  const contributors = new Map();
  Object.keys(data).forEach((month) => {
    data[month].forEach((item) => {
      if (contributors.has(item[0])) {
        contributors.set(item[0], contributors.get(item[0]) + 1);
      } else {
        contributors.set(item[0], 0);
      }
    });
  });
  let count = 0;
  contributors.forEach((value) => {
    // only count contributors who have contributed more than 3 months
    if (value >= 3) {
      count++;
    }
  });
  return [count, [...contributors.keys()]];
};

export const DEFAULT_FREQUENCY = 2000;

/**
 * get the echarts option with the given data, month and speed.
 */
export const getOption = async (data, month, speed, maxBars, enableAnimation) => {
  const updateFrequency = DEFAULT_FREQUENCY / speed;
  const rich = {};
  const sortedData = orderBy(data[month], (item) => item[1], 'desc');
  const topData = take(sortedData, maxBars);
  const barData = await Promise.all(
    topData.map(async (item) => {
      // rich name cannot contain special characters such as '-'
      rich[`avatar${item[0].replaceAll('-', '')}`] = {
        backgroundColor: {
          image: `https://avatars.githubusercontent.com/${item[0]}?s=48&v=4`,
        },
        height: 20,
      };
      const avatarColors = await avatarColorStore.getColors(item[0]);
      return {
        value: item,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              {
                offset: 0,
                color: avatarColors[0],
              },
              {
                offset: 0.5,
                color: avatarColors[1],
              },
            ],
            global: false,
          },
        },
      };
    })
  );

  return {
    grid: {
      top: 10,
      bottom: 30,
      left: 160,
      right: 50,
    },
    xAxis: {
      max: 'dataMax',
      axisLabel: {
        show: true,
        color: DARK_TEXT_COLOR,
      },
      animationDuration: 0,
      animationDurationUpdate: enableAnimation ? 200 : 0,
    },
    yAxis: {
      type: 'category',
      inverse: true,
      max: maxBars,
      axisLabel: {
        show: true,
        color: DARK_TEXT_COLOR,
        fontSize: 14,
        formatter: function (value) {
          if (!value || value.endsWith('[bot]')) return value;
          return `${value} {avatar${value.replaceAll('-', '')}|}`;
        },
        rich,
      },
      axisTick: {
        show: false,
      },
      animationDuration: 0,
      animationDurationUpdate: enableAnimation ? 200 : 0,
    },
    series: [
      {
        realtimeSort: true,
        seriesLayoutBy: 'column',
        type: 'bar',
        data: barData,
        encode: {
          x: 1,
          y: 0,
        },
        label: {
          show: true,
          precision: 1,
          position: 'right',
          valueAnimation: true,
          fontFamily: 'monospace',
          color: DARK_TEXT_COLOR,
        },
      },
    ],
    // Disable init animation.
    animationDuration: 0,
    animationDurationUpdate: enableAnimation ? updateFrequency : 0,
    animationEasing: 'linear',
    animationEasingUpdate: 'linear',
    graphic: {
      elements: [
        {
          type: 'text',
          right: 40,
          bottom: 40,
          style: {
            text: month,
            font: 'bolder 40px monospace',
            fill: DARK_TEXT_COLOR,
          },
          z: 100,
        },
      ],
    },
  };
};
