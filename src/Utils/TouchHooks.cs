using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Utils;
using FixVectorLeak;
using System;
using System.Collections.Generic;
using System.Linq;

public static class TouchHooks
{
    private static readonly Dictionary<int, HashSet<CBaseEntity>> _lastTouchedEntities = new();

    public static void Load()
    {
        Console.WriteLine("[BlockMaker] TouchHooks: Loading...");
        Plugin.Instance.RegisterListenerPinned<Listeners.OnTick>(OnTick);
        Console.WriteLine("[BlockMaker] TouchHooks: Loaded tick listener!");
    }

    public static void Unload()
    {
        Plugin.Instance.RemoveListenerPinned<Listeners.OnTick>(OnTick);
        _lastTouchedEntities.Clear();
    }

    public static void OnPlayerDisconnect(int slot)
    {
        _lastTouchedEntities.Remove(slot);
    }

    private static bool IsTouchingBlock(CCSPlayerPawn pawn, CBaseEntity blockEntity, Blocks.Data blockData)
    {
        if (pawn.AbsOrigin == null || blockEntity.AbsOrigin == null || blockEntity.Collision == null || pawn.Collision == null)
            return false;

        Vector_t blockMaxs = blockEntity.Collision.Maxs.ToVector_t() * 2;
        Vector_t playerMaxs = pawn.Collision.Maxs.ToVector_t() * 2;

        return VectorUtils.IsWithinBounds(blockEntity.AbsOrigin.ToVector_t(), pawn.AbsOrigin.ToVector_t(), blockMaxs, playerMaxs);
    }

    private static bool IsTouchingTeleport(CCSPlayerPawn pawn, CBaseEntity teleportEntity)
    {
        if (pawn.AbsOrigin == null || teleportEntity.AbsOrigin == null || teleportEntity.Collision == null || pawn.Collision == null)
            return false;

        Vector_t teleportMaxs = teleportEntity.Collision.Maxs.ToVector_t() * 2;
        Vector_t playerMaxs = pawn.Collision.Maxs.ToVector_t() * 2;

        return VectorUtils.IsWithinBounds(teleportEntity.AbsOrigin.ToVector_t(), pawn.AbsOrigin.ToVector_t(), teleportMaxs, playerMaxs);
    }

    public static void OnTick()
    {
        try
        {
            var players = Utilities.GetPlayers();
            if (players == null) return;

            foreach (var player in players)
            {
                if (player == null || !player.IsValid || player.IsBot) continue;

                int slot = player.Slot;
                if (!_lastTouchedEntities.TryGetValue(slot, out var lastTouched))
                {
                    lastTouched = new HashSet<CBaseEntity>();
                    _lastTouchedEntities[slot] = lastTouched;
                }

                // Ghost/observer players don't interact with blocks at all
                if (Commands.GhostPlayers.Contains(slot)) continue;

                var pawn = player.PlayerPawn.Value;
                if (pawn == null || !pawn.IsValid || pawn.LifeState != (byte)LifeState_t.LIFE_ALIVE)
                {
                    if (lastTouched.Count > 0)
                    {
                        lastTouched.Clear();
                    }
                    continue;
                }

                var currentTouched = new HashSet<CBaseEntity>();

                // 1. Check blocks (use copy of keys to prevent CollectionModifiedException)
                var blockKeys = Blocks.Entities.Keys.ToList();
                foreach (var blockEntity in blockKeys)
                {
                    if (blockEntity == null || !blockEntity.IsValid || blockEntity.Entity == null) continue;
                    if (!Blocks.Entities.TryGetValue(blockEntity, out var blockData) || blockData == null) continue;

                    // Skip if block is being held by builder
                    if (Building.BuildMode)
                    {
                        bool isHeld = false;
                        foreach (var builderHold in Building.BuilderHolds.Values)
                        {
                            if (builderHold != null && builderHold.Entity == blockEntity)
                            {
                                isHeld = true;
                                break;
                            }
                        }
                        if (isHeld) continue;
                    }

                    try
                    {
                        if (IsTouchingBlock(pawn, blockEntity, blockData))
                        {
                            currentTouched.Add(blockEntity);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[BlockMaker] Exception in IsTouchingBlock: {ex.Message}");
                    }
                }

                // 2. Check teleports (use copy of list to prevent CollectionModifiedException)
                var teleportList = Teleports.Entities.ToList();
                foreach (var pair in teleportList)
                {
                    if (pair == null) continue;

                    var entry = pair.Entry;
                    if (entry != null && entry.Entity != null && entry.Entity.IsValid && entry.Entity.Entity != null)
                    {
                        try
                        {
                            if (IsTouchingTeleport(pawn, entry.Entity))
                            {
                                currentTouched.Add(entry.Entity);
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[BlockMaker] Exception in IsTouchingTeleport (entry): {ex.Message}");
                        }
                    }

                    var exit = pair.Exit;
                    if (exit != null && exit.Entity != null && exit.Entity.IsValid && exit.Entity.Entity != null)
                    {
                        try
                        {
                            if (IsTouchingTeleport(pawn, exit.Entity))
                            {
                                currentTouched.Add(exit.Entity);
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[BlockMaker] Exception in IsTouchingTeleport (exit): {ex.Message}");
                        }
                    }
                }

                // Detect StartTouch and Touch events
                foreach (var entity in currentTouched)
                {
                    if (entity == null || !entity.IsValid) continue;

                    if (!lastTouched.Contains(entity))
                    {
                        try
                        {
                            TriggerStartTouch(player, pawn, entity);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[BlockMaker] Exception in TriggerStartTouch: {ex.Message}");
                        }
                    }
                    try
                    {
                        TriggerTouch(player, pawn, entity);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[BlockMaker] Exception in TriggerTouch: {ex.Message}");
                    }
                }

                // Detect EndTouch events
                foreach (var entity in lastTouched)
                {
                    if (entity != null && entity.IsValid && !currentTouched.Contains(entity))
                    {
                        try
                        {
                            TriggerEndTouch(player, pawn, entity);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[BlockMaker] Exception in TriggerEndTouch: {ex.Message}");
                        }
                    }
                }

                // Update last touched set
                _lastTouchedEntities[slot] = currentTouched;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[BlockMaker] Exception in TouchHooks.OnTick: {ex.Message}\n{ex.StackTrace}");
        }
    }

    private static void TriggerStartTouch(CCSPlayerController player, CCSPlayerPawn pawn, CBaseEntity caller)
    {
        if (caller == null || caller.Entity == null) return;

        // Teleports (only on start touch)
        var teleport = Teleports.Entities.FirstOrDefault(pair => 
            (pair.Entry != null && pair.Entry.Entity == caller) || 
            (pair.Exit != null && pair.Exit.Entity == caller)
        );
        if (teleport != null)
        {
            Teleports.Action(teleport, caller, pawn);
        }

        if (Blocks.Entities.TryGetValue(caller, out var block))
        {
            // Bhop and Delay blocks trigger from any touch direction, not just from the top
            bool isBhopOrDelay = block.Type == Blocks.Models.Data.Bhop.Title ||
                                  block.Type == Blocks.Models.Data.Delay.Title;
            bool isDeath = block.Type == Blocks.Models.Data.Death.Title;

            if (!isBhopOrDelay && (block.Properties.OnTop || isDeath) && !VectorUtils.CheckOnTop(block, pawn))
            {
                return;
            }

            if (Utils.CorrectTeam(player, block.Team))
            {
                Blocks.Actions(player, block.Entity);
            }
        }
    }

    private static void TriggerTouch(CCSPlayerController player, CCSPlayerPawn pawn, CBaseEntity caller)
    {
        if (caller == null || caller.Entity == null) return;

        if (Blocks.Entities.TryGetValue(caller, out var block))
        {
            // Bhop and Delay blocks trigger from any touch direction
            bool isBhopOrDelay = block.Type == Blocks.Models.Data.Bhop.Title ||
                                  block.Type == Blocks.Models.Data.Delay.Title;

            if (!isBhopOrDelay && !VectorUtils.CheckOnTop(block, pawn))
                return;

            if (Utils.CorrectTeam(player, block.Team))
            {
                Blocks.Actions(player, block.Entity);
            }
        }
    }

    private static void TriggerEndTouch(CCSPlayerController player, CCSPlayerPawn pawn, CBaseEntity caller)
    {
        // No action needed for EndTouch currently
    }
}