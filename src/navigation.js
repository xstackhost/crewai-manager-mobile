import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import theme from './theme';

// Auth screens
import ServerSetup from './screens/ServerSetup';
import LoginScreen from './screens/Login';

// Main screens
import DashboardScreen from './screens/Dashboard';
import AgentList from './screens/AgentList';
import AgentForm from './screens/AgentForm';
import TaskList from './screens/TaskList';
import TaskForm from './screens/TaskForm';
import ToolList from './screens/ToolList';
import ToolForm from './screens/ToolForm';
import LLMList from './screens/LLMList';
import LLMForm from './screens/LLMForm';
import CrewList from './screens/CrewList';
import CrewForm from './screens/CrewForm';
import FlowList from './screens/FlowList';
import FlowForm from './screens/FlowForm';
import RunExecution from './screens/RunExecution';
import ExecutionList from './screens/ExecutionList';
import ExecutionDetail from './screens/ExecutionDetail';
import MoreScreen from './screens/MoreScreen';
import KnowledgeList from './screens/KnowledgeList';
import KnowledgeForm from './screens/KnowledgeForm';
import SchedulerList from './screens/SchedulerList';
import SchedulerForm from './screens/SchedulerForm';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: theme.card },
  headerTintColor: theme.text,
  headerTitleStyle: { fontWeight: '700', color: theme.text },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: theme.bg },
};

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

// Agent Stack: agents, tasks, tools, llm configs
function AgentStack({ route }) {
  const { onLogout } = route.params || {};
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AgentList" component={AgentList} options={{ title: 'Agents' }} />
      <Stack.Screen name="AgentForm" component={AgentForm} options={({ route }) => ({ title: route.params?.agent ? 'Edit Agent' : 'New Agent' })} />
      <Stack.Screen name="TaskList" component={TaskList} options={{ title: 'Tasks' }} />
      <Stack.Screen name="TaskForm" component={TaskForm} options={({ route }) => ({ title: route.params?.task ? 'Edit Task' : 'New Task' })} />
      <Stack.Screen name="ToolList" component={ToolList} options={{ title: 'Tools' }} />
      <Stack.Screen name="ToolForm" component={ToolForm} options={({ route }) => ({ title: route.params?.tool ? 'Edit Tool' : 'New Tool' })} />
      <Stack.Screen name="LLMList" component={LLMList} options={{ title: 'LLM Configs' }} />
      <Stack.Screen name="LLMForm" component={LLMForm} options={({ route }) => ({ title: route.params?.config ? 'Edit LLM Config' : 'New LLM Config' })} />
    </Stack.Navigator>
  );
}

// Crew Stack: crews + flows
function CrewStack({ route }) {
  const { onLogout } = route.params || {};
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="CrewList" component={CrewList} options={{ title: 'Crews' }} />
      <Stack.Screen name="CrewForm" component={CrewForm} options={({ route }) => ({ title: route.params?.crew ? 'Edit Crew' : 'New Crew' })} />
      <Stack.Screen name="FlowList" component={FlowList} options={{ title: 'Flows' }} />
      <Stack.Screen name="FlowForm" component={FlowForm} options={({ route }) => ({ title: route.params?.flow ? 'Edit Flow' : 'New Flow' })} />
      <Stack.Screen name="RunExecution" component={RunExecution} options={{ title: 'Run' }} />
      <Stack.Screen name="ExecutionDetail" component={ExecutionDetail} options={{ title: 'Execution' }} />
    </Stack.Navigator>
  );
}

// Run Stack
function RunStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ExecutionList" component={ExecutionList} options={{ title: 'Executions' }} />
      <Stack.Screen name="ExecutionDetail" component={ExecutionDetail} options={{ title: 'Execution Detail' }} />
      <Stack.Screen name="RunExecution" component={RunExecution} options={{ title: 'Run' }} />
    </Stack.Navigator>
  );
}

// More Stack
function MoreStack({ route }) {
  const params = route.params || {};
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="MoreMenu"
        options={{ title: 'More' }}
      >
        {(props) => <MoreScreen {...props} onLogout={params.onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="TaskList" component={TaskList} options={{ title: 'Tasks' }} />
      <Stack.Screen name="TaskForm" component={TaskForm} options={({ route }) => ({ title: route.params?.task ? 'Edit Task' : 'New Task' })} />
      <Stack.Screen name="ToolList" component={ToolList} options={{ title: 'Tools' }} />
      <Stack.Screen name="ToolForm" component={ToolForm} options={({ route }) => ({ title: route.params?.tool ? 'Edit Tool' : 'New Tool' })} />
      <Stack.Screen name="LLMList" component={LLMList} options={{ title: 'LLM Configs' }} />
      <Stack.Screen name="LLMForm" component={LLMForm} options={({ route }) => ({ title: route.params?.config ? 'Edit LLM Config' : 'New LLM Config' })} />
      <Stack.Screen name="KnowledgeList" component={KnowledgeList} options={{ title: 'Knowledge' }} />
      <Stack.Screen name="KnowledgeForm" component={KnowledgeForm} options={({ route }) => ({ title: route.params?.item ? 'Edit Knowledge' : 'New Knowledge' })} />
      <Stack.Screen name="SchedulerList" component={SchedulerList} options={{ title: 'Scheduler' }} />
      <Stack.Screen name="SchedulerForm" component={SchedulerForm} options={({ route }) => ({ title: route.params?.job ? 'Edit Job' : 'New Job' })} />
    </Stack.Navigator>
  );
}

// Home Stack (wraps Dashboard so it can push to other screens)
function HomeStack({ route }) {
  const params = route?.params || {};
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Dashboard" options={{ headerShown: false }}>
        {(props) => <DashboardScreen {...props} onLogout={params.onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export function MainNavigator({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
        initialParams={{ onLogout }}
      >
        {(props) => <HomeStack {...props} route={{ ...props.route, params: { onLogout } }} />}
      </Tab.Screen>
      <Tab.Screen
        name="AgentsTab"
        component={AgentStack}
        options={{
          title: 'Agents',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
        }}
        initialParams={{ onLogout }}
      />
      <Tab.Screen
        name="CrewsTab"
        component={CrewStack}
        options={{
          title: 'Crews',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" focused={focused} />,
        }}
        initialParams={{ onLogout }}
      />
      <Tab.Screen
        name="RunsTab"
        component={RunStack}
        options={{
          title: 'Runs',
          tabBarIcon: ({ focused }) => <TabIcon emoji="▶️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => <TabIcon emoji="☰" focused={focused} />,
        }}
        initialParams={{ onLogout }}
      >
        {(props) => <MoreStack {...props} route={{ ...props.route, params: { onLogout } }} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function AuthNavigator({ onLogin, onServerConfigured }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServerSetup">
        {(props) => <ServerSetup {...props} onComplete={onServerConfigured} />}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            {...props}
            onLogin={onLogin}
            onChangeServer={() => props.navigation.navigate('ServerSetup')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
