using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Translations;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Events;

public partial class Plugin : BasePlugin, IPluginConfig<Config>
{
    public override string ModuleName => "Block Maker";
    public override string ModuleVersion => "0.2.6";
    public override string ModuleAuthor => "exkludera";

    public static Plugin Instance = new();

    private readonly HashSet<Delegate> _activeDelegates = new();
    private readonly Dictionary<CounterStrikeSharp.API.Modules.Timers.Timer, Delegate> _activeTimers = new();

    public CounterStrikeSharp.API.Modules.Timers.Timer StartTimer(float interval, Action callback, CounterStrikeSharp.API.Modules.Timers.TimerFlags flags = 0)
    {
        CounterStrikeSharp.API.Modules.Timers.Timer? timer = null;
        if ((flags & CounterStrikeSharp.API.Modules.Timers.TimerFlags.REPEAT) != 0)
        {
            _activeDelegates.Add(callback);
            timer = AddTimer(interval, callback, flags);
            _activeTimers[timer] = callback;
            return timer;
        }
        else
        {
            Action? wrappedCallback = null;
            wrappedCallback = () =>
            {
                try
                {
                    callback();
                }
                finally
                {
                    if (wrappedCallback != null)
                    {
                        _activeDelegates.Remove(wrappedCallback);
                        if (timer != null)
                        {
                            _activeTimers.Remove(timer);
                        }
                    }
                }
            };
            _activeDelegates.Add(wrappedCallback);
            timer = AddTimer(interval, wrappedCallback, flags);
            _activeTimers[timer] = wrappedCallback;
            return timer;
        }
    }

    public void KillTimer(CounterStrikeSharp.API.Modules.Timers.Timer? timer)
    {
        if (timer != null)
        {
            timer.Kill();
            if (_activeTimers.TryGetValue(timer, out var del))
            {
                _activeDelegates.Remove(del);
                _activeTimers.Remove(timer);
            }
        }
    }

    public void RegisterListenerPinned<T>(T callback) where T : Delegate
    {
        _activeDelegates.Add(callback);
        RegisterListener<T>(callback);
    }

    public void RemoveListenerPinned<T>(T callback) where T : Delegate
    {
        RemoveListener<T>(callback);
        _activeDelegates.Remove(callback);
    }

    public void RegisterEventHandlerPinned<T>(GameEventHandler<T> handler, HookMode mode = HookMode.Pre) where T : GameEvent
    {
        _activeDelegates.Add(handler);
        RegisterEventHandler<T>(handler, mode);
    }

    public void DeregisterEventHandlerPinned<T>(GameEventHandler<T> handler, HookMode mode = HookMode.Pre) where T : GameEvent
    {
        DeregisterEventHandler<T>(handler, mode);
        _activeDelegates.Remove(handler);
    }

    public void AddCommandListenerPinned(string command, CommandInfo.CommandListenerCallback handler, HookMode mode = HookMode.Pre)
    {
        _activeDelegates.Add(handler);
        AddCommandListener(command, handler, mode);
    }

    public void RemoveCommandListenerPinned(string command, CommandInfo.CommandListenerCallback handler, HookMode mode = HookMode.Pre)
    {
        RemoveCommandListener(command, handler, mode);
        _activeDelegates.Remove(handler);
    }

    public void HookUserMessagePinned(int msgId, CounterStrikeSharp.API.Modules.UserMessages.UserMessage.UserMessageHandler handler, HookMode mode = HookMode.Pre)
    {
        _activeDelegates.Add(handler);
        HookUserMessage(msgId, handler, mode);
    }

    public void UnhookUserMessagePinned(int msgId, CounterStrikeSharp.API.Modules.UserMessages.UserMessage.UserMessageHandler handler, HookMode mode = HookMode.Pre)
    {
        UnhookUserMessage(msgId, handler, mode);
        _activeDelegates.Remove(handler);
    }

    public override void Load(bool hotReload)
    {
        Instance = this;

        RegisterListener<Listeners.OnServerPrecacheResources>((manifest) =>
        {
            // Precache soundevents file
            if (!string.IsNullOrEmpty(Config.Sounds.SoundEvents))
            {
                manifest.AddResource(Config.Sounds.SoundEvents);
            }

            // Precache block models
            foreach (var block in Blocks.Models.Data.GetAllBlocks())
            {
                if (!string.IsNullOrEmpty(block.Block))
                {
                    manifest.AddResource(block.Block);
                }
                if (!string.IsNullOrEmpty(block.Pole))
                {
                    manifest.AddResource(block.Pole);
                }
            }

            // Precache teleport models
            if (!string.IsNullOrEmpty(Config.Settings.Teleports.Entry.Model))
            {
                manifest.AddResource(Config.Settings.Teleports.Entry.Model);
            }
            if (!string.IsNullOrEmpty(Config.Settings.Teleports.Exit.Model))
            {
                manifest.AddResource(Config.Settings.Teleports.Exit.Model);
            }

            // Precache camouflage models
            if (!string.IsNullOrEmpty(Config.Settings.Blocks.CamouflageT))
            {
                manifest.AddResource(Config.Settings.Blocks.CamouflageT);
            }
            if (!string.IsNullOrEmpty(Config.Settings.Blocks.CamouflageCT))
            {
                manifest.AddResource(Config.Settings.Blocks.CamouflageCT);
            }

            // Precache light model
            if (!string.IsNullOrEmpty(Config.Settings.Lights.Model))
            {
                manifest.AddResource(Config.Settings.Lights.Model);
            }
        });

        Events.Register();

        Commands.Load();

        Files.Load();

        if (hotReload)
        {
            foreach (var player in Utilities.GetPlayers())
            {
                if (Utils.HasPermission(player) || Files.Builders.steamids.Contains(player.SteamID.ToString()))
                    Building.Builders[player.Slot] = new Building.BuilderData { BlockType = Blocks.Models.Data.Platform.Title };
            }

            Files.mapsFolder = Path.Combine(ModuleDirectory, "maps", Server.MapName);
            Directory.CreateDirectory(Files.mapsFolder);

            Utils.Clear();

            Files.EntitiesData.Load();
        }
    }

    public override void Unload(bool hotReload)
    {
        Events.Deregister();

        Commands.Unload();

        Instance.KillTimer(Events.AutoSaveTimer);
        Events.AutoSaveTimer = null;

        Utils.Clear();
    }

    public Config Config { get; set; } = new();
    public void OnConfigParsed(Config config)
    {
        Config = config;
        Config.Settings.Prefix = StringExtensions.ReplaceColorTags(config.Settings.Prefix);

        Building.BuildMode = config.Settings.Building.BuildMode.Enable;
    }
}