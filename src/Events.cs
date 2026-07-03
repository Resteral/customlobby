using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Timers;
using CounterStrikeSharp.API.Modules.Utils;
using FixVectorLeak;
using Timer = CounterStrikeSharp.API.Modules.Timers.Timer;

public static class Events
{
    private static Plugin Instance = Plugin.Instance;
    private static Config Config = Instance.Config;

    public static void Register()
    {
        Instance.RegisterListenerPinned<Listeners.OnTick>(Building.OnTick);
        Instance.RegisterListenerPinned<Listeners.OnTick>(FreezeTagManager.OnTick);
        Instance.RegisterListenerPinned<Listeners.OnTick>(HideAndSeekManager.OnTick);
        Instance.RegisterListenerPinned<Listeners.OnMapStart>(OnMapStart);
        Instance.RegisterListenerPinned<Listeners.OnMapEnd>(OnMapEnd);
        Instance.RegisterListenerPinned<Listeners.OnServerPrecacheResources>(OnServerPrecacheResources);
        Instance.RegisterListenerPinned<Listeners.OnPlayerTakeDamagePre>(OnPlayerTakeDamagePre);

        Instance.RegisterEventHandlerPinned<EventPlayerConnectFull>(EventPlayerConnectFull);
        Instance.RegisterEventHandlerPinned<EventPlayerDisconnect>(EventPlayerDisconnect);
        Instance.RegisterEventHandlerPinned<EventRoundStart>(EventRoundStart);
        Instance.RegisterEventHandlerPinned<EventRoundEnd>(EventRoundEnd);
        Instance.RegisterEventHandlerPinned<EventPlayerDeath>(EventPlayerDeath);
        Instance.RegisterEventHandlerPinned<EventSmokegrenadeDetonate>(EventSmokegrenadeDetonate);

        Instance.AddCommandListenerPinned("say", OnCommandSay, HookMode.Pre);
        Instance.AddCommandListenerPinned("say_team", OnCommandSay, HookMode.Pre);

        Transmit.Load();

        TouchHooks.Load();
    }

    public static void Deregister()
    {
        Instance.RemoveListenerPinned<Listeners.OnTick>(Building.OnTick);
        Instance.RemoveListenerPinned<Listeners.OnTick>(FreezeTagManager.OnTick);
        Instance.RemoveListenerPinned<Listeners.OnTick>(HideAndSeekManager.OnTick);
        Instance.RemoveListenerPinned<Listeners.OnMapStart>(OnMapStart);
        Instance.RemoveListenerPinned<Listeners.OnMapEnd>(OnMapEnd);
        Instance.RemoveListenerPinned<Listeners.OnServerPrecacheResources>(OnServerPrecacheResources);
        Instance.RemoveListenerPinned<Listeners.OnPlayerTakeDamagePre>(OnPlayerTakeDamagePre);

        Instance.DeregisterEventHandlerPinned<EventPlayerConnectFull>(EventPlayerConnectFull);
        Instance.DeregisterEventHandlerPinned<EventPlayerDisconnect>(EventPlayerDisconnect);
        Instance.DeregisterEventHandlerPinned<EventRoundStart>(EventRoundStart);
        Instance.DeregisterEventHandlerPinned<EventRoundEnd>(EventRoundEnd);
        Instance.DeregisterEventHandlerPinned<EventPlayerDeath>(EventPlayerDeath);
        Instance.DeregisterEventHandlerPinned<EventSmokegrenadeDetonate>(EventSmokegrenadeDetonate);

        Instance.RemoveCommandListenerPinned("say", OnCommandSay, HookMode.Pre);
        Instance.RemoveCommandListenerPinned("say_team", OnCommandSay, HookMode.Pre);

        Transmit.Unload();

        TouchHooks.Unload();
    }

    public static Timer? AutoSaveTimer;
    private static void OnMapStart(string mapname)
    {
        string nextLayoutPath = Path.Combine(Instance.ModuleDirectory, "next_layout.txt");
        string layoutName = "";
        if (File.Exists(nextLayoutPath))
        {
            try
            {
                layoutName = File.ReadAllText(nextLayoutPath).Trim();
                File.WriteAllText(nextLayoutPath, "");
            }
            catch (Exception ex)
            {
                Utils.Log($"Failed to read next_layout.txt: {ex.Message}");
            }
        }

        if (!string.IsNullOrEmpty(layoutName))
        {
            Files.mapsFolder = Path.Combine(Instance.ModuleDirectory, "maps", layoutName);
        }
        else
        {
            Files.mapsFolder = Path.Combine(Instance.ModuleDirectory, "maps", Server.MapName);
        }
        Directory.CreateDirectory(Files.mapsFolder);

        if (Config.Settings.Building.AutoSave.Enable)
        {
            Instance.KillTimer(AutoSaveTimer);

            AutoSaveTimer = Instance.StartTimer(Config.Settings.Building.AutoSave.Timer, () =>
            {
                if (!Building.BuildMode)
                    return;

                Files.EntitiesData.Save(true);
            }, TimerFlags.REPEAT | TimerFlags.STOP_ON_MAPCHANGE);
        }

        if (Config.Settings.Building.BuildMode.Config)
        {
            List<string> commands =
            [
                "sv_cheats 1", "mp_join_grace_time 3600", "mp_timelimit 60",
                "mp_roundtime 60", "mp_freezetime 0", "mp_warmuptime 0", "mp_maxrounds 99"
            ];

            foreach (string command in commands)
                Server.ExecuteCommand(command);
        }
    }

    private static void OnMapEnd()
    {
        Utils.Clear();
    }

    private static void OnServerPrecacheResources(ResourceManifest manifest)
    {
        List<string> resources =
        [
            Config.Sounds.SoundEvents,
            Config.Settings.Teleports.Entry.Model,
            Config.Settings.Teleports.Exit.Model,
            Config.Settings.Blocks.CamouflageT,
            Config.Settings.Blocks.CamouflageCT,
            Config.Settings.Blocks.FireParticle,
            Config.Settings.Lights.Model,
        ];

        foreach (var effect in Config.Settings.Blocks.Effects)
            resources.Add(effect.Particle);

        foreach (var model in Blocks.Models.Data.GetAllBlocks())
        {
            resources.Add(model.Block);
            resources.Add(model.Pole);
        }

        foreach (var resource in resources)
        {
            if (!string.IsNullOrEmpty(resource))
                manifest.AddResource(resource);
        }
    }

    private static HookResult EventPlayerConnectFull(EventPlayerConnectFull @event, GameEventInfo info)
    {
        var player = @event.Userid;

        if (player == null || player.NotValid())
            return HookResult.Continue;

        if (Building.BuildMode)
        {
            Files.Builders.Load();

            if (Utils.HasPermission(player) || Files.Builders.steamids.Contains(player.SteamID.ToString()))
                Building.Builders[player.Slot] = new Building.BuilderData { BlockType = Blocks.Models.Data.Platform.Title };
        }

        return HookResult.Continue;
    }

    private static HookResult EventRoundStart(EventRoundStart @event, GameEventInfo info)
    {
        Utils.Clear();
        Files.EntitiesData.Load();
        CTFManager.OnRoundStart();

        // Clear ghost mode for all players each round so no one is stuck ghosted
        Commands.GhostPlayers.Clear();

        return HookResult.Continue;
    }

    private static HookResult EventRoundEnd(EventRoundEnd @event, GameEventInfo info)
    {
        if (Building.BuildMode && Config.Settings.Building.AutoSave.Enable)
            Files.EntitiesData.Save();
        CTFManager.OnRoundEnd();
        FreezeTagManager.OnRoundEnd();
        HideAndSeekManager.OnRoundEnd();

        return HookResult.Continue;
    }

    private static HookResult EventPlayerDeath(EventPlayerDeath @event, GameEventInfo info)
    {
        var player = @event.Userid;

        if (player == null || player.NotValid())
            return HookResult.Continue;

        CTFManager.OnPlayerDeath(player);
        FreezeTagManager.OnPlayerDeath(player);
        HideAndSeekManager.OnPlayerDeath(player);

        Blocks.FrostGrenadeOwners.Remove(player.Slot);
        Blocks.FrozenPlayers.Remove(player.Slot);
        Commands.GhostPlayers.Remove(player.Slot);

        if (Blocks.PlayerCooldowns.TryGetValue(player.Slot, out var playerCooldowns))
            playerCooldowns.Clear();

        if (Blocks.CooldownsTimers.TryGetValue(player.Slot, out var playerTimers))
        {
            foreach (var timer in playerTimers)
                timer.Kill();

            playerTimers.Clear();
        }

        if (Blocks.HiddenPlayers.TryGetValue(player, out var hiddenPlayer))
            Blocks.HiddenPlayers.Remove(player);

        return HookResult.Continue;
    }

    private static HookResult EventSmokegrenadeDetonate(EventSmokegrenadeDetonate @event, GameEventInfo info)
    {
        var thrower = @event.Userid;
        if (thrower == null || thrower.NotValid()) return HookResult.Continue;

        // Only freeze players if this smoke was a frost grenade from the block
        if (!Blocks.FrostGrenadeOwners.Remove(thrower.Slot)) return HookResult.Continue;

        var detonatePos = new CounterStrikeSharp.API.Modules.Utils.Vector(@event.X, @event.Y, @event.Z);
        const float freezeRadius = 400f;
        const float freezeDuration = 3.0f;

        foreach (var target in Utilities.GetPlayers())
        {
            if (target == null || target.NotValid() || !target.IsAlive()) continue;
            // Don't freeze the thrower's own team? Up to you — currently freezes everyone including thrower
            var pawn = target.PlayerPawn.Value;
            if (pawn?.AbsOrigin == null) continue;

            float dx = pawn.AbsOrigin.X - detonatePos.X;
            float dy = pawn.AbsOrigin.Y - detonatePos.Y;
            float dz = pawn.AbsOrigin.Z - detonatePos.Z;
            float distSq = dx * dx + dy * dy + dz * dz;

            if (distSq <= freezeRadius * freezeRadius)
            {
                FreezePlayer(target, pawn, freezeDuration);
            }
        }

        return HookResult.Continue;
    }

    internal static void FreezePlayer(CCSPlayerController player, CCSPlayerPawn pawn, float duration)
    {
        if (Blocks.FrozenPlayers.Contains(player.Slot)) return;

        Blocks.FrozenPlayers.Add(player.Slot);

        // Freeze movement
        pawn.MoveType = MoveType_t.MOVETYPE_NONE;
        CounterStrikeSharp.API.Modules.Memory.Schema.SetSchemaValue(pawn.Handle, "CBaseEntity", "m_nActualMoveType", 0);
        Utilities.SetStateChanged(pawn, "CBaseEntity", "m_MoveType");

        // Blue tint to show frozen
        var origRender = pawn.Render;
        pawn.Render = System.Drawing.Color.FromArgb(origRender.A, 100, 180, 255);
        Utilities.SetStateChanged(pawn, "CBaseModelEntity", "m_clrRender");

        Utils.PrintToChat(player, $"{ChatColors.Blue}You are frozen!");

        Instance.StartTimer(duration, () =>
        {
            if (player == null || player.NotValid() || !player.IsAlive()) return;
            var p = player.PlayerPawn.Value;
            if (p == null) return;

            Blocks.FrozenPlayers.Remove(player.Slot);

            // Restore movement
            p.MoveType = MoveType_t.MOVETYPE_WALK;
            CounterStrikeSharp.API.Modules.Memory.Schema.SetSchemaValue(p.Handle, "CBaseEntity", "m_nActualMoveType", 2);
            Utilities.SetStateChanged(p, "CBaseEntity", "m_MoveType");

            // Restore colour
            p.Render = origRender;
            Utilities.SetStateChanged(p, "CBaseModelEntity", "m_clrRender");

            Utils.PrintToChat(player, $"{ChatColors.Green}You are no longer frozen.");
        });
    }

    private static HookResult EventPlayerDisconnect(EventPlayerDisconnect @event, GameEventInfo info)
    {
        var player = @event.Userid;

        if (player == null || player.NotValid())
            return HookResult.Continue;

        CTFManager.OnPlayerDisconnect(player);
        FreezeTagManager.OnPlayerDisconnect(player);
        HideAndSeekManager.OnPlayerDisconnect(player);

        TouchHooks.OnPlayerDisconnect(player.Slot);

        Blocks.FrostGrenadeOwners.Remove(player.Slot);
        Blocks.FrozenPlayers.Remove(player.Slot);
        Commands.GhostPlayers.Remove(player.Slot);

        if (Blocks.PlayerCooldowns.TryGetValue(player.Slot, out var playerCooldowns))
            playerCooldowns.Clear();

        if (Blocks.CooldownsTimers.TryGetValue(player.Slot, out var playerTimers))
        {
            foreach (var timer in playerTimers)
                timer.Kill();

            playerTimers.Clear();
        }

        Blocks.HiddenPlayers.Remove(player);

        Building.Builders.Remove(player.Slot);

        return HookResult.Continue;
    }

    private static HookResult OnCommandSay(CCSPlayerController? player, CommandInfo info)
    {
        if (player == null || player.NotValid())
            return HookResult.Continue;

        if (Building.Builders.TryGetValue(player.Slot, out var pData))
        {
            var type = pData.ChatInput;

            if (!string.IsNullOrEmpty(type))
            {
                var input = info.ArgString.Replace("\"", "").Trim();

                // If player is trying to type a command (starts with ! or /) or explicitly cancels/exits, cancel chat input mode
                if (input.StartsWith("!") || input.StartsWith("/") || 
                    input.Equals("cancel", StringComparison.OrdinalIgnoreCase) || 
                    input.Equals("exit", StringComparison.OrdinalIgnoreCase))
                {
                    pData.ChatInput = "";
                    return HookResult.Continue;
                }

                if (!float.TryParse(input, out float number) || (number <= 0 && type != "Snap"))
                {
                    Utils.PrintToChat(player, $"{ChatColors.Red}Invalid input value: {ChatColors.White}{input}");
                    return HookResult.Handled;
                }

                switch (type)
                {
                    case "Grid":
                        pData.GridValue = number;
                        Utils.PrintToChat(player, $"Grid Value: {ChatColors.White}{number}");
                        break;
                    case "Snap":
                        pData.SnapValue = number;
                        Utils.PrintToChat(player, $"Snap Value: {ChatColors.White}{number}");
                        break;
                    case "Rotation":
                        pData.RotationValue = number;
                        Utils.PrintToChat(player, $"Rotation Value: {ChatColors.White}{number}");
                        break;
                    case "Position":
                        pData.PositionValue = number;
                        Utils.PrintToChat(player, $"Position Value: {ChatColors.White}{number}");
                        break;
                    case "LightBrightness":
                        Commands.LightSettings(player, type, input);
                        break;
                    case "LightDistance":
                        Commands.LightSettings(player, type, input);
                        break;
                    case "Reset":
                    default:
                        Commands.Properties(player, type, input);
                        break;
                }

                pData.ChatInput = "";

                return HookResult.Handled;
            }
        }
    
        return HookResult.Continue;
    }

    private static HookResult OnPlayerTakeDamagePre(CCSPlayerPawn pawn, CTakeDamageInfo info)
    {
        if (pawn.DesignerName == "player" && info.Attacker.Value?.DesignerName == "player")
            return HookResult.Continue;

        var blockModels = Blocks.Models.Data;
        string NoFallDmg = blockModels.NoFallDmg.Title;
        string Trampoline = blockModels.Trampoline.Title;

        foreach (var blocktarget in Blocks.Entities.Where(x => x.Value.Type.Equals(NoFallDmg) || x.Value.Type.Equals(Trampoline)))
        {
            var block = blocktarget.Key;

            if (pawn.AbsOrigin == null || block.AbsOrigin == null)
                return HookResult.Continue;

            Vector_t playerMaxs = pawn.Collision.Maxs.ToVector_t() * 2;
            Vector_t blockMaxs = block.Collision!.Maxs.ToVector_t() * 2;

            if (VectorUtils.IsWithinBounds(block.AbsOrigin.ToVector_t(), pawn.AbsOrigin.ToVector_t(), blockMaxs, playerMaxs))
            {
                if (blocktarget.Value.Properties.OnTop)
                {
                    Vector_t blockOrigin = block.AbsOrigin!.ToVector_t();
                    Vector_t pawnOrigin = pawn.AbsOrigin!.ToVector_t();
                    QAngle_t blockRotation = block.AbsRotation!.ToQAngle_t();

                    if (VectorUtils.IsTopOnly(blockOrigin, pawnOrigin, blockMaxs, playerMaxs, blockRotation))
                        return HookResult.Handled;
                }
                else return HookResult.Handled;
            }
        }

        return HookResult.Continue;
    }
}