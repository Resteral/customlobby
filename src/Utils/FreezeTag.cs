using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Entities.Constants;
using CounterStrikeSharp.API.Modules.Timers;
using CounterStrikeSharp.API.Modules.Utils;
using System.Drawing;
using Timer = CounterStrikeSharp.API.Modules.Timers.Timer;

public static class FreezeTagManager
{
    public static bool IsActive = false;

    // Remember the BuildMode state before this mode took over
    private static bool _buildModeSnapshot = false;

    // Slots of currently frozen CT players
    public static HashSet<int> FrozenPlayers = new();

    // Prevent rapid re-tagging (slot -> last tag time)
    private static Dictionary<int, float> _tagCooldowns = new();

    // Auto-unfreeze safety timers (slot -> timer)
    private static Dictionary<int, Timer?> _unfreezeTimers = new();

    // Original colours before freeze tint, so we can restore properly
    private static Dictionary<int, Color> _originalColours = new();

    private const float TagRadius      = 80f;   // units - close enough to count as a tag
    private const float TagCooldown    = 1.5f;   // seconds before same runner can be re-tagged
    private const float AutoUnfreeze   = 30f;    // seconds before auto-unfreeze safety kicks in

    // ── Toggle ──────────────────────────────────────────────────────────────

    public static void Toggle(CCSPlayerController? caller)
    {
        IsActive = !IsActive;

        // Clean up all state on every toggle
        foreach (var t in _unfreezeTimers.Values) t?.Kill();
        _unfreezeTimers.Clear();
        _tagCooldowns.Clear();

        // Unfreeze anyone who was frozen when toggling off
        foreach (var slot in FrozenPlayers.ToList())
        {
            var p = Utilities.GetPlayerFromSlot(slot);
            if (p != null) ApplyUnfreeze(p);
        }
        FrozenPlayers.Clear();
        _originalColours.Clear();

        if (IsActive)
        {
            // Save current BuildMode state, then disable it — builders shouldn't be placing
            // blocks while a special gamemode is running
            _buildModeSnapshot = Building.BuildMode;
            Building.BuildMode = false;
            Building.BuilderHolds.Clear();
        }
        else
        {
            // Restore BuildMode to whatever it was before
            Building.BuildMode = _buildModeSnapshot;
        }

        string msg = IsActive
            ? $"🧊 {ChatColors.Lime}Freeze Tag STARTED! " +
              $"{ChatColors.Orange}T = taggers{ChatColors.Default}, " +
              $"{ChatColors.Blue}CT = runners. " +
              $"Touch a CT to freeze them — CT teammates can unfreeze each other!"
            : $"🧊 Freeze Tag has {ChatColors.Red}ENDED.";

        foreach (var p in Utilities.GetPlayers())
            Utils.PrintToChat(p, msg);
    }

    // ── Tick (called every server tick) ─────────────────────────────────────

    public static void OnTick()
    {
        if (!IsActive) return;

        var players = Utilities.GetPlayers()
            .Where(p => p != null && p.IsValid && p.IsAlive() &&
                        (p.Team == CsTeam.Terrorist || p.Team == CsTeam.CounterTerrorist))
            .ToList();

        float now = Server.CurrentTime;

        // ── T taggers freeze CT runners ──
        foreach (var tagger in players.Where(p => p.Team == CsTeam.Terrorist && !FrozenPlayers.Contains(p.Slot)))
        {
            var tPawn = tagger.PlayerPawn.Value;
            if (tPawn?.AbsOrigin == null) continue;

            foreach (var runner in players.Where(p => p.Team == CsTeam.CounterTerrorist && !FrozenPlayers.Contains(p.Slot)))
            {
                // Per-runner tag cooldown
                if (_tagCooldowns.TryGetValue(runner.Slot, out float last) && now - last < TagCooldown) continue;

                var rPawn = runner.PlayerPawn.Value;
                if (rPawn?.AbsOrigin == null) continue;

                if (DistanceSq(tPawn.AbsOrigin, rPawn.AbsOrigin) <= TagRadius * TagRadius)
                {
                    FreezePlayer(runner);
                    _tagCooldowns[runner.Slot] = now;
                    _tagCooldowns[tagger.Slot] = now; // tagger also gets brief gap before next tag
                    Utils.PrintToChat(tagger, $"🧊 You froze {ChatColors.Orange}{runner.PlayerName}{ChatColors.Default}!");
                }
            }
        }

        // ── CT teammates unfreeze frozen CTs ──
        foreach (var helper in players.Where(p => p.Team == CsTeam.CounterTerrorist && !FrozenPlayers.Contains(p.Slot)))
        {
            var hPawn = helper.PlayerPawn.Value;
            if (hPawn?.AbsOrigin == null) continue;

            foreach (var frozen in players.Where(p => p.Team == CsTeam.CounterTerrorist && FrozenPlayers.Contains(p.Slot)).ToList())
            {
                var fPawn = frozen.PlayerPawn.Value;
                if (fPawn?.AbsOrigin == null) continue;

                if (DistanceSq(hPawn.AbsOrigin, fPawn.AbsOrigin) <= TagRadius * TagRadius)
                {
                    UnfreezePlayer(frozen);
                    Utils.PrintToChat(helper, $"✅ You unfroze {ChatColors.Lime}{frozen.PlayerName}{ChatColors.Default}!");
                }
            }
        }

        // ── Win condition: all CT frozen ──
        var ctPlayers = players.Where(p => p.Team == CsTeam.CounterTerrorist).ToList();
        if (ctPlayers.Count > 0 && ctPlayers.All(p => FrozenPlayers.Contains(p.Slot)))
        {
            foreach (var p in Utilities.GetPlayers())
                Utils.PrintToChat(p, $"🧊 {ChatColors.Orange}T team wins! All CTs are frozen!");

            // Unfreeze everyone and end the mode
            foreach (var p in ctPlayers.ToList()) UnfreezePlayer(p);
            IsActive = false;
        }
    }

    // ── Freeze / Unfreeze helpers ────────────────────────────────────────────

    private static void FreezePlayer(CCSPlayerController player)
    {
        if (FrozenPlayers.Contains(player.Slot)) return;
        FrozenPlayers.Add(player.Slot);

        var pawn = player.PlayerPawn.Value;
        if (pawn == null) return;

        // Save original colour
        _originalColours[player.Slot] = pawn.Render;

        // Blue ice tint
        pawn.Render = Color.FromArgb(pawn.Render.A, 100, 180, 255);
        Utilities.SetStateChanged(pawn, "CBaseModelEntity", "m_clrRender");

        // Stop movement
        pawn.MoveType = MoveType_t.MOVETYPE_NONE;
        CounterStrikeSharp.API.Modules.Memory.Schema.SetSchemaValue(pawn.Handle, "CBaseEntity", "m_nActualMoveType", 0);
        Utilities.SetStateChanged(pawn, "CBaseEntity", "m_MoveType");

        Utils.PrintToChat(player, $"🧊 {ChatColors.Blue}You are FROZEN! A CT teammate must touch you to unfreeze!");

        // Auto-unfreeze safety timer
        _unfreezeTimers.TryGetValue(player.Slot, out var old);
        old?.Kill();
        _unfreezeTimers[player.Slot] = Plugin.Instance.StartTimer(AutoUnfreeze, () =>
        {
            if (FrozenPlayers.Contains(player.Slot))
            {
                UnfreezePlayer(player);
                Utils.PrintToChat(player, $"✅ Auto-unfrozen after {AutoUnfreeze}s.");
            }
        });
    }

    private static void UnfreezePlayer(CCSPlayerController player)
    {
        if (!FrozenPlayers.Remove(player.Slot)) return;

        _unfreezeTimers.TryGetValue(player.Slot, out var t);
        t?.Kill();
        _unfreezeTimers.Remove(player.Slot);

        ApplyUnfreeze(player);
        Utils.PrintToChat(player, $"✅ {ChatColors.Green}You've been UNFROZEN! Run!");
    }

    private static void ApplyUnfreeze(CCSPlayerController player)
    {
        var pawn = player.PlayerPawn.Value;
        if (pawn == null) return;

        // Restore movement
        pawn.MoveType = MoveType_t.MOVETYPE_WALK;
        CounterStrikeSharp.API.Modules.Memory.Schema.SetSchemaValue(pawn.Handle, "CBaseEntity", "m_nActualMoveType", 2);
        Utilities.SetStateChanged(pawn, "CBaseEntity", "m_MoveType");

        // Restore colour
        Color restore = _originalColours.TryGetValue(player.Slot, out var orig) ? orig : Color.FromArgb(255, 255, 255, 255);
        pawn.Render = restore;
        Utilities.SetStateChanged(pawn, "CBaseModelEntity", "m_clrRender");
        _originalColours.Remove(player.Slot);
    }

    // ── Event hooks ──────────────────────────────────────────────────────────

    public static void OnPlayerDeath(CCSPlayerController player)
    {
        _tagCooldowns.Remove(player.Slot);
        if (!FrozenPlayers.Remove(player.Slot)) return;

        _unfreezeTimers.TryGetValue(player.Slot, out var t);
        t?.Kill();
        _unfreezeTimers.Remove(player.Slot);
        _originalColours.Remove(player.Slot);
    }

    public static void OnPlayerDisconnect(CCSPlayerController player)
        => OnPlayerDeath(player);

    public static void OnRoundEnd()
    {
        foreach (var slot in FrozenPlayers.ToList())
        {
            var p = Utilities.GetPlayerFromSlot(slot);
            if (p != null) ApplyUnfreeze(p);
        }
        FrozenPlayers.Clear();
        _tagCooldowns.Clear();
        foreach (var t in _unfreezeTimers.Values) t?.Kill();
        _unfreezeTimers.Clear();
        _originalColours.Clear();

        if (IsActive)
        {
            IsActive = false;
            Building.BuildMode = _buildModeSnapshot;
            foreach (var p in Utilities.GetPlayers())
                Utils.PrintToChat(p, "🧊 Freeze Tag ended (round over).");
        }
    }

    // ── Utility ─────────────────────────────────────────────────────────────

    private static float DistanceSq(CounterStrikeSharp.API.Modules.Utils.Vector a, CounterStrikeSharp.API.Modules.Utils.Vector b)
    {
        float dx = a.X - b.X, dy = a.Y - b.Y, dz = a.Z - b.Z;
        return dx * dx + dy * dy + dz * dz;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hide and Seek gamemode
// T = Hiders (given 30-second head-start, seekers are frozen)
// CT = Seekers (tag hiders by proximity to eliminate them)
// ─────────────────────────────────────────────────────────────────────────────
public static class HideAndSeekManager
{
    public static bool IsActive   = false;
    public static bool HidePhase  = false;  // true during the T hide countdown

    private static bool _buildModeSnapshot = false;
    private static float _hideCountdown    = 15f;
    private static float _hideRemaining    = 0f;

    private static readonly HashSet<int> _eliminatedHiders = new();
    private static CounterStrikeSharp.API.Modules.Timers.Timer? _tickTimer = null;

    private const float TagRadius   = 100f;
    private const float TagCooldown = 2.0f;
    private static readonly Dictionary<int, float> _tagCooldowns = new();

    // ── Toggle ──────────────────────────────────────────────────────────────

    public static void Toggle(CCSPlayerController? caller)
    {
        if (IsActive)
        {
            Stop();
            foreach (var p in Utilities.GetPlayers())
                Utils.PrintToChat(p, $"🙈 Hide and Seek has {ChatColors.Red}ENDED.");
            return;
        }

        IsActive  = true;
        HidePhase = true;
        _hideRemaining    = _hideCountdown;
        _eliminatedHiders.Clear();
        _tagCooldowns.Clear();

        // Disable BuildMode for the duration
        _buildModeSnapshot   = Building.BuildMode;
        Building.BuildMode   = false;
        Building.BuilderHolds.Clear();

        // Freeze CT seekers during hide phase
        foreach (var p in Utilities.GetPlayers().Where(p => p.IsValid && p.IsAlive() && p.Team == CsTeam.CounterTerrorist))
            FreezeSeeker(p, freeze: true);

        foreach (var p in Utilities.GetPlayers())
            Utils.PrintToChat(p,
                $"🙈 {ChatColors.Lime}Hide and Seek STARTED! " +
                $"{ChatColors.Orange}T = Hiders — GO HIDE! " +
                $"{ChatColors.Blue}CT = Seekers — wait {_hideCountdown:0}s!");

        // Countdown tick every second
        _tickTimer = Plugin.Instance.StartTimer(1.0f, OnHideTick, CounterStrikeSharp.API.Modules.Timers.TimerFlags.REPEAT | CounterStrikeSharp.API.Modules.Timers.TimerFlags.STOP_ON_MAPCHANGE);
    }

    private static void Stop()
    {
        IsActive  = false;
        HidePhase = false;
        _eliminatedHiders.Clear();
        _tagCooldowns.Clear();
        _tickTimer?.Kill();
        _tickTimer = null;
        Building.BuildMode = _buildModeSnapshot;

        // Unfreeze all seekers just in case
        foreach (var p in Utilities.GetPlayers().Where(p => p.IsValid && p.IsAlive() && p.Team == CsTeam.CounterTerrorist))
            FreezeSeeker(p, freeze: false);
    }

    // ── Hide-phase countdown ─────────────────────────────────────────────────

    private static void OnHideTick()
    {
        if (!IsActive) return;
        if (!HidePhase) return;

        _hideRemaining -= 1f;

        if (_hideRemaining <= 0f)
        {
            HidePhase = false;

            // Unfreeze seekers — the hunt begins!
            foreach (var p in Utilities.GetPlayers().Where(p => p.IsValid && p.IsAlive() && p.Team == CsTeam.CounterTerrorist))
                FreezeSeeker(p, freeze: false);

            foreach (var p in Utilities.GetPlayers())
                Utils.PrintToChat(p, $"🔍 {ChatColors.Red}SEEK! CTs are now hunting!");

            _tickTimer?.Kill();
            _tickTimer = null;
        }
        else if (_hideRemaining <= 5f)
        {
            foreach (var p in Utilities.GetPlayers())
                Utils.PrintToChat(p, $"🙈 Seekers released in {ChatColors.Red}{_hideRemaining:0}{ChatColors.Default}s!");
        }
    }

    // ── Per-tick seek logic ──────────────────────────────────────────────────

    public static void OnTick()
    {
        if (!IsActive || HidePhase) return;

        var players = Utilities.GetPlayers()
            .Where(p => p != null && p.IsValid && p.IsAlive() &&
                        (p.Team == CsTeam.Terrorist || p.Team == CsTeam.CounterTerrorist))
            .ToList();

        float now = Server.CurrentTime;
        var seekers = players.Where(p => p.Team == CsTeam.CounterTerrorist).ToList();
        var hiders  = players.Where(p => p.Team == CsTeam.Terrorist && !_eliminatedHiders.Contains(p.Slot)).ToList();

        foreach (var seeker in seekers)
        {
            var sPawn = seeker.PlayerPawn.Value;
            if (sPawn?.AbsOrigin == null) continue;

            foreach (var hider in hiders)
            {
                if (_tagCooldowns.TryGetValue(hider.Slot, out float last) && now - last < TagCooldown) continue;

                var hPawn = hider.PlayerPawn.Value;
                if (hPawn?.AbsOrigin == null) continue;

                float dx = sPawn.AbsOrigin.X - hPawn.AbsOrigin.X;
                float dy = sPawn.AbsOrigin.Y - hPawn.AbsOrigin.Y;
                float dz = sPawn.AbsOrigin.Z - hPawn.AbsOrigin.Z;
                if ((dx*dx + dy*dy + dz*dz) <= TagRadius * TagRadius)
                {
                    _eliminatedHiders.Add(hider.Slot);
                    _tagCooldowns[hider.Slot] = now;
                    hider.PlayerPawn.Value?.CommitSuicide(true, true);
                    Utils.PrintToChat(seeker, $"✅ You found {ChatColors.Orange}{hider.PlayerName}{ChatColors.Default}!");
                    foreach (var p in Utilities.GetPlayers())
                        Utils.PrintToChat(p, $"🔍 {ChatColors.Orange}{seeker.PlayerName}{ChatColors.Default} found {ChatColors.Yellow}{hider.PlayerName}{ChatColors.Default}!");
                }
            }
        }

        // Win condition: all hiders eliminated
        var remainingHiders = players.Where(p => p.Team == CsTeam.Terrorist && !_eliminatedHiders.Contains(p.Slot)).ToList();
        if (players.Any(p => p.Team == CsTeam.Terrorist) && remainingHiders.Count == 0)
        {
            foreach (var p in Utilities.GetPlayers())
                Utils.PrintToChat(p, $"🔍 {ChatColors.LightBlue}Seekers win! All hiders were found!");
            Stop();
        }
    }

    // ── Events ───────────────────────────────────────────────────────────────

    public static void OnRoundEnd()
    {
        if (IsActive)
            Stop();
    }

    public static void OnPlayerDeath(CCSPlayerController player)
    {
        _tagCooldowns.Remove(player.Slot);
        _eliminatedHiders.Remove(player.Slot);
    }

    public static void OnPlayerDisconnect(CCSPlayerController player)
        => OnPlayerDeath(player);

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static void FreezeSeeker(CCSPlayerController p, bool freeze)
    {
        var pawn = p.PlayerPawn.Value;
        if (pawn == null) return;
        if (freeze)
        {
            pawn.MoveType = MoveType_t.MOVETYPE_NONE;
            CounterStrikeSharp.API.Modules.Memory.Schema.SetSchemaValue(pawn.Handle, "CBaseEntity", "m_nActualMoveType", 0);
        }
        else
        {
            pawn.MoveType = MoveType_t.MOVETYPE_WALK;
            CounterStrikeSharp.API.Modules.Memory.Schema.SetSchemaValue(pawn.Handle, "CBaseEntity", "m_nActualMoveType", 2);
        }
        Utilities.SetStateChanged(pawn, "CBaseEntity", "m_MoveType");
    }
}
